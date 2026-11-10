-- nightcap: house moments
--
-- - gifts left on the front step for someone in the house
-- - the moment a house stops being just you: when the second person moved in

-- gifts on the step -----------------------------------------------------------

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  from_user uuid not null,
  to_user uuid not null,
  kind text not null check (
    kind in ('flowers', 'cake', 'wine', 'candle', 'record', 'plant', 'book', 'tea')
  ),
  created_at timestamptz not null default now(),
  -- once it's been taken in it's off the step
  taken_at timestamptz,
  check (from_user <> to_user),
  -- both of you have to live there; moving out takes your gifts with you
  foreign key (house_id, from_user) references public.memberships on delete cascade,
  foreign key (house_id, to_user) references public.memberships on delete cascade
);
create index if not exists gifts_on_the_step on public.gifts (house_id, created_at)
  where taken_at is null;

alter table public.gifts enable row level security;
-- the step is out front: everyone who lives here can see what's on it and
-- who it's for. Only the person it's for can take it in.
create policy "residents see the step" on public.gifts
  for select using (public.is_member(house_id));
create policy "leave gifts as yourself" on public.gifts
  for insert with check (from_user = auth.uid() and public.is_member(house_id));
-- taking a gift in is an update rather than a delete, so everyone watching
-- the street sees it go (realtime can't filter deletes by house)
create policy "take in gifts for you" on public.gifts
  for update using (to_user = auth.uid()) with check (to_user = auth.uid());

grant select on public.gifts to authenticated;
grant insert (house_id, to_user, from_user, kind) on public.gifts to authenticated;
grant update (taken_at) on public.gifts to authenticated;

-- the step only holds so much: ten a day from any one person, and no more
-- than six waiting for anyone
create or replace function public.gifts_fit_on_the_step()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (
    select count(*) from public.gifts
    where from_user = new.from_user and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'that''s a lot of gifts for one day, try again tomorrow';
  end if;
  if (
    select count(*) from public.gifts
    where house_id = new.house_id and to_user = new.to_user and taken_at is null
  ) >= 6 then
    raise exception 'their step is full, wait for them to take some in';
  end if;
  return new;
end;
$$;
revoke execute on function public.gifts_fit_on_the_step() from public, anon, authenticated;
drop trigger if exists gifts_fit_on_the_step on public.gifts;
create trigger gifts_fit_on_the_step before insert on public.gifts
  for each row execute function public.gifts_fit_on_the_step();

-- house-warming -----------------------------------------------------------------

alter table public.houses add column if not exists warmed_at timestamptz;

-- houses that already have company were warmed when their second person joined
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

-- live ----------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['gifts', 'houses'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
