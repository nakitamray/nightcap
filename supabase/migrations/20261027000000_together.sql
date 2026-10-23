-- nightcap: being in the house together
--
-- - everyone has a character (profiles.avatar)
-- - presence says where in the house you are, so people show up in rooms
-- - notes slipped under someone's door
-- - what you're listening to, for your housemates to see
-- - a house still waiting for a friend can be kept a little longer

-- characters ----------------------------------------------------------------

alter table public.profiles add column if not exists avatar jsonb;
alter table public.profiles
  add constraint profiles_avatar_shape
  check (avatar is null or (jsonb_typeof(avatar) = 'object' and octet_length(avatar::text) <= 2048));
grant update (display_name, city, time_zone, lat, lon, avatar) on public.profiles to authenticated;

-- where you are -------------------------------------------------------------

-- 'street', 'lounge' or 'room:<n>'
alter table public.presence add column if not exists place text not null default 'street';
alter table public.presence
  add constraint presence_place_shape check (place ~ '^(street|lounge|room:([0-9]|1[01]))$');

drop function if exists public.here(uuid);
create or replace function public.here(h uuid, place text default 'street')
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.memberships where house_id = h and user_id = auth.uid()) then
    raise exception 'you don''t live here';
  end if;
  insert into public.presence (house_id, user_id, seen_at, place)
  values (h, auth.uid(), now(), place)
  on conflict (house_id, user_id) do update set seen_at = excluded.seen_at, place = excluded.place;
end;
$$;
revoke execute on function public.here(uuid, text) from public, anon;
grant execute on function public.here(uuid, text) to authenticated;

-- notes under the door ------------------------------------------------------

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  from_user uuid not null,
  to_user uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (from_user <> to_user),
  -- both of you have to live there; moving out takes your notes with you
  foreign key (house_id, from_user) references public.memberships on delete cascade,
  foreign key (house_id, to_user) references public.memberships on delete cascade
);
create index if not exists notes_to_user on public.notes (to_user, house_id, created_at desc);

alter table public.notes enable row level security;
-- a note is between the two of you
create policy "see notes to or from you" on public.notes
  for select using (to_user = auth.uid() or from_user = auth.uid());
create policy "write notes as yourself" on public.notes
  for insert with check (from_user = auth.uid() and public.is_member(house_id));
create policy "mark your notes read" on public.notes
  for update using (to_user = auth.uid()) with check (to_user = auth.uid());
create policy "throw away notes to you" on public.notes
  for delete using (to_user = auth.uid());

grant select, delete on public.notes to authenticated;
grant insert (house_id, to_user, from_user, body) on public.notes to authenticated;
grant update (read_at) on public.notes to authenticated;

-- nobody gets buried in notes: thirty a day from any one person
create or replace function public.notes_slow_down()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (
    select count(*) from public.notes
    where from_user = new.from_user and created_at > now() - interval '1 day'
  ) >= 30 then
    raise exception 'that''s a lot of notes for one day, try again tomorrow';
  end if;
  return new;
end;
$$;
drop trigger if exists notes_slow_down on public.notes;
create trigger notes_slow_down before insert on public.notes
  for each row execute function public.notes_slow_down();

-- now playing ---------------------------------------------------------------

-- the server writes this with your session whenever it asks spotify what
-- you're playing, and clears it when you stop. Housemates can read it; the
-- spotify tokens themselves stay in spotify_links, which only you can read.
create table if not exists public.now_playing (
  user_id uuid primary key references auth.users on delete cascade,
  title text not null check (char_length(title) <= 300),
  artist text not null check (char_length(artist) <= 300),
  art text check (art is null or (char_length(art) <= 500 and art like 'https://%')),
  url text check (url is null or (char_length(url) <= 500 and url like 'https://open.spotify.com/%')),
  updated_at timestamptz not null default now()
);
alter table public.now_playing enable row level security;
create policy "you and your housemates" on public.now_playing
  for select using (user_id = auth.uid() or public.shares_house_with(user_id));
create policy "only your own" on public.now_playing
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.now_playing to authenticated;

-- keeping a house -----------------------------------------------------------

alter table public.houses add column if not exists keep_until timestamptz;
alter table public.houses add column if not exists extensions smallint not null default 0;

-- houses nobody else joined go away a week after they're made, or later if
-- someone asked for more time
create or replace function public.sweep_lonely_houses()
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.houses h
  where greatest(h.created_at + interval '7 days', coalesce(h.keep_until, h.created_at)) < now()
    and (select count(*) from public.memberships m where m.house_id = h.id) < 2;
$$;

-- another week, up to three times
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
  if (select count(*) from public.memberships where house_id = h) >= 2 then
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
revoke execute on function public.keep_house(uuid) from public, anon;
grant execute on function public.keep_house(uuid) to authenticated;

-- live ----------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['notes', 'now_playing'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
