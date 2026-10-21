-- usernames, claiming rooms, the five-house keyring, room layouts, spotify.

-- usernames ---------------------------------------------------------------

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key on public.profiles (lower(username));
alter table public.profiles add constraint profiles_username_shape
  check (username is null or username ~ '^[A-Za-z0-9_]{3,20}$') not valid;

-- new sign-ups bring their username along in the metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  wanted text := new.raw_user_meta_data ->> 'username';
begin
  insert into public.profiles (id, display_name, username)
  values (new.id, coalesce(wanted, split_part(new.email, '@', 1)), wanted);
  return new;
end;
$$;

-- signed-out people need to check a name is free before they sign up
create or replace function public.username_available(wanted text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(wanted));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- rooms are claimed, not handed out ----------------------------------------

alter table public.memberships alter column room drop not null;
alter table public.memberships add column if not exists layout jsonb not null default '{}'::jsonb;

-- you can change your curtains and your room's layout, but not your room
-- number directly -- that goes through claim_room
revoke update on public.memberships from authenticated;
grant update (curtains, layout) on public.memberships to authenticated;

create or replace function public.claim_room(h uuid, wanted smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if wanted < 0 or wanted > 11 then
    raise exception 'no such room';
  end if;
  if not exists (select 1 from public.memberships where house_id = h and user_id = auth.uid()) then
    raise exception 'you don''t live here';
  end if;
  -- one at a time per house, so two people can't grab the same room
  perform 1 from public.houses where id = h for update;
  if exists (select 1 from public.memberships where house_id = h and room = wanted and user_id <> auth.uid()) then
    raise exception 'someone already lives there';
  end if;
  -- moving rooms: the old one just becomes vacant, and the layout comes with you
  update public.memberships set room = wanted where house_id = h and user_id = auth.uid();
end;
$$;
revoke execute on function public.claim_room(uuid, smallint) from public, anon;
grant execute on function public.claim_room(uuid, smallint) to authenticated;

-- the keyring: five houses each, and a house only counts once two live there

create or replace function public.house_count(who uuid)
returns int
language sql
stable
security definer set search_path = ''
as $$
  select count(*)::int from public.memberships where user_id = who;
$$;

/** houses nobody else joined within a week go away */
create or replace function public.sweep_lonely_houses()
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.houses h
  where h.created_at < now() - interval '7 days'
    and (select count(*) from public.memberships m where m.house_id = h.id) < 2;
$$;
revoke execute on function public.sweep_lonely_houses() from public, anon;
grant execute on function public.sweep_lonely_houses() to authenticated;

create or replace function public.create_house(house_name text, house_theme text default 'paris')
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  perform public.sweep_lonely_houses();
  if public.house_count(auth.uid()) >= 5 then
    raise exception 'you already have five houses -- leave one to make another';
  end if;
  insert into public.houses (name, theme, created_by)
  values (house_name, house_theme, auth.uid())
  returning id into new_id;
  -- no room yet: you pick one once you're inside
  insert into public.memberships (house_id, user_id, room) values (new_id, auth.uid(), null);
  return new_id;
end;
$$;

create or replace function public.join_house(invite_code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  inv public.invites;
  people int;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select * into inv from public.invites where code = invite_code and expires_at > now();
  if not found then
    raise exception 'that invite has expired or doesn''t exist';
  end if;

  if exists (select 1 from public.memberships where house_id = inv.house_id and user_id = auth.uid()) then
    return inv.house_id;
  end if;

  if public.house_count(auth.uid()) >= 5 then
    raise exception 'you already have five houses -- leave one to join this';
  end if;

  perform 1 from public.houses where id = inv.house_id for update;
  select count(*) into people from public.memberships where house_id = inv.house_id;
  if people >= 12 then
    raise exception 'this house is full (12 rooms)';
  end if;

  insert into public.memberships (house_id, user_id, room) values (inv.house_id, auth.uid(), null);
  return inv.house_id;
end;
$$;

revoke execute on function public.create_house(text, text) from public, anon;
revoke execute on function public.join_house(text) from public, anon;
grant execute on function public.create_house(text, text) to authenticated;
grant execute on function public.join_house(text) to authenticated;
grant execute on function public.house_count(uuid) to authenticated;

-- spotify -----------------------------------------------------------------

-- only ever readable by the person it belongs to; the server reads it with
-- their session to ask spotify what they're playing
create table if not exists public.spotify_links (
  user_id uuid primary key references auth.users on delete cascade,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.spotify_links enable row level security;
create policy "your own spotify" on public.spotify_links
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.spotify_links to authenticated;

-- profiles: the map poster sets your city and time zone. usernames are fixed.
revoke update on public.profiles from authenticated;
grant update (display_name, city, time_zone) on public.profiles to authenticated;
