-- nightcap: tightening things up
--
-- - house_count can't be used to look up other people's houses
-- - nobody edits a house after it's made (name, marquee, created_by)
-- - room layouts have a size limit
-- - map pins are rounded here, not just in the app
-- - joining from an invite shows you the house first (invite_preview)
-- - "home" comes from a heartbeat the database stamps, not from what a
--   browser says about itself, and the live channel is members only

-- house_count -------------------------------------------------------------

-- only create_house and join_house need it, and they run as the owner
revoke execute on function public.house_count(uuid) from public, anon, authenticated;

-- houses ------------------------------------------------------------------

drop policy if exists "members can update their house" on public.houses;
revoke update on public.houses from authenticated;

-- layouts -----------------------------------------------------------------

-- a full room is well under 2kb; this is plenty with room to grow
alter table public.memberships
  add constraint memberships_layout_shape
  check (jsonb_typeof(layout) = 'object' and octet_length(layout::text) <= 8192);

-- map pins ----------------------------------------------------------------

-- a tenth of a degree is about 10km: the town, never the street
create or replace function public.round_pin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.lat := round(new.lat::numeric, 1)::double precision;
  new.lon := round(new.lon::numeric, 1)::double precision;
  return new;
end;
$$;

drop trigger if exists profiles_round_pin on public.profiles;
create trigger profiles_round_pin
  before insert or update of lat, lon on public.profiles
  for each row execute function public.round_pin();

-- and anything already saved
update public.profiles set lat = lat, lon = lon where lat is not null or lon is not null;

-- invites -----------------------------------------------------------------

-- what you'd be joining, so the join page can ask before it does anything.
-- only for a live invite, and only to someone signed in.
create or replace function public.invite_preview(invite_code text)
returns table (house_name text, house_theme text, people int)
language sql
stable
security definer set search_path = ''
as $$
  select h.name, h.theme, (select count(*)::int from public.memberships m where m.house_id = h.id)
  from public.invites i
  join public.houses h on h.id = i.house_id
  where i.code = invite_code and i.expires_at > now() and auth.uid() is not null;
$$;
revoke execute on function public.invite_preview(text) from public, anon;
grant execute on function public.invite_preview(text) to authenticated;

-- who's home --------------------------------------------------------------

-- when each person last had the house open. Only the database writes the
-- time (through here()), so nobody can claim to be home for someone else,
-- or for the rest of the week.
create table if not exists public.presence (
  house_id uuid not null,
  user_id uuid not null,
  seen_at timestamptz not null default now(),
  primary key (house_id, user_id),
  foreign key (house_id, user_id) references public.memberships on delete cascade
);
alter table public.presence enable row level security;
create policy "members can see who's home" on public.presence
  for select using (public.is_member(house_id));
grant select on public.presence to authenticated;

create or replace function public.here(h uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.memberships where house_id = h and user_id = auth.uid()) then
    raise exception 'you don''t live here';
  end if;
  insert into public.presence (house_id, user_id, seen_at)
  values (h, auth.uid(), now())
  on conflict (house_id, user_id) do update set seen_at = excluded.seen_at;
end;
$$;
revoke execute on function public.here(uuid) from public, anon;
grant execute on function public.here(uuid) to authenticated;

-- realtime ----------------------------------------------------------------

-- the street listens for curtains and lights as database changes, which
-- realtime only passes on to people the table's own policies let see them
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'presence'
  ) then
    alter publication supabase_realtime add table public.presence;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'memberships'
  ) then
    alter publication supabase_realtime add table public.memberships;
  end if;
end;
$$;

-- the house's channel ("house:<id>") is private: only people who live there
-- can join it. There's no insert policy, so nobody can broadcast on it either.
create or replace function public.house_topic_member(topic text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select case
    when topic ~ '^house:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_member(substr(topic, 7)::uuid)
    else false
  end;
$$;
revoke execute on function public.house_topic_member(text) from public, anon;
grant execute on function public.house_topic_member(text) to authenticated;

drop policy if exists "housemates can listen" on realtime.messages;
create policy "housemates can listen" on realtime.messages
  for select to authenticated
  using (public.house_topic_member(realtime.topic()));
