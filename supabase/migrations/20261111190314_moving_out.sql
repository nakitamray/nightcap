-- nightcap: moving out, and leaving for good
--
-- - move out of a house; the last one out closes it
-- - delete your account and everything that's yours
-- - a house that's had friends in it isn't swept away when it's down to one
--   (once it's warmed, see house-moments)
-- - spotify tokens are only ever stored encrypted

-- warmed houses ------------------------------------------------------------

-- the first time a second person moves in, the house is warmed (the same
-- column and trigger as the house-moments migration, repeated here so this
-- one stands on its own; both are safe to run in either order). Until then
-- it's waiting for a friend and the sweep can take it; after, it stays even
-- if people move out and it's down to one.
alter table public.houses add column if not exists warmed_at timestamptz;
update public.houses h
set warmed_at = (
  select m.joined_at from public.memberships m
  where m.house_id = h.id
  order by m.joined_at
  offset 1 limit 1
)
where h.warmed_at is null;

create or replace function public.warm_the_house()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.houses set warmed_at = now()
  where id = new.house_id
    and warmed_at is null
    and (select count(*) from public.memberships where house_id = new.house_id) >= 2;
  return null;
end;
$$;
revoke execute on function public.warm_the_house() from public, anon, authenticated;
drop trigger if exists warm_the_house on public.memberships;
create trigger warm_the_house after insert on public.memberships
  for each row execute function public.warm_the_house();

-- houses nobody else joined go away a week after they're made (or later, if
-- someone asked for more time); houses with nobody left in them go too
create or replace function public.sweep_lonely_houses()
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.houses h
  where not exists (select 1 from public.memberships m where m.house_id = h.id)
     or (
       h.warmed_at is null
       and greatest(h.created_at + interval '7 days', coalesce(h.keep_until, h.created_at)) < now()
       and (select count(*) from public.memberships m where m.house_id = h.id) < 2
     );
$$;

-- a warmed house doesn't need more time
create or replace function public.keep_house(h uuid)
returns timestamptz
language plpgsql
security definer set search_path = ''
as $$
declare
  house public.houses;
  until timestamptz;
begin
  if not public.is_member(h) then
    raise exception 'you don''t live here';
  end if;
  select * into house from public.houses where id = h for update;
  if house.warmed_at is not null or (select count(*) from public.memberships where house_id = h) >= 2 then
    raise exception 'this house is already staying';
  end if;
  if house.extensions >= 3 then
    raise exception 'that''s as long as a house can wait';
  end if;
  until := greatest(house.created_at + interval '7 days', coalesce(house.keep_until, now())) + interval '7 days';
  update public.houses set keep_until = until, extensions = extensions + 1 where id = h;
  return until;
end;
$$;

-- moving out ---------------------------------------------------------------

-- your room, your presence and the notes to and from you go with you (they
-- hang off your membership). If you were the last one there, the house goes.
create or replace function public.leave_house(h uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  -- one at a time per house, so two people leaving at once can't strand it
  perform 1 from public.houses where id = h for update;
  delete from public.memberships where house_id = h and user_id = auth.uid();
  if not found then
    raise exception 'you don''t live here';
  end if;
  delete from public.houses
  where id = h and not exists (select 1 from public.memberships where house_id = h);
end;
$$;
revoke execute on function public.leave_house(uuid) from public, anon;
grant execute on function public.leave_house(uuid) to authenticated;

-- leaving for good -----------------------------------------------------------

-- moves you out of every house, then deletes your login. Everything else that
-- was yours (profile, invites you made, spotify, what you were playing) goes
-- with it through the foreign keys.
create or replace function public.delete_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  h uuid;
begin
  if me is null then
    raise exception 'not signed in';
  end if;
  for h in select house_id from public.memberships where user_id = me order by house_id loop
    perform 1 from public.houses where id = h for update;
    delete from public.memberships where house_id = h and user_id = me;
    delete from public.houses
    where id = h and not exists (select 1 from public.memberships where house_id = h);
  end loop;
  delete from auth.users where id = me;
end;
$$;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- spotify --------------------------------------------------------------------

-- the server now encrypts tokens before they're saved, with a key the
-- database never sees, so the browser can only ever read ciphertext. Links
-- saved before that were plain text: drop them (people just reconnect), and
-- refuse anything that isn't encrypted from here on.
delete from public.spotify_links where refresh_token not like 'v1:%';
update public.spotify_links set access_token = null, expires_at = null
where access_token is not null and access_token not like 'v1:%';
alter table public.spotify_links drop constraint if exists spotify_links_encrypted;
alter table public.spotify_links
  add constraint spotify_links_encrypted check (
    refresh_token like 'v1:%' and (access_token is null or access_token like 'v1:%')
  );
