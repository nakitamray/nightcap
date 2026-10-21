-- nightcap: houses, rooms, invites
--
-- Everything here is locked down with row level security. The rule of thumb:
-- you can only see a house (and the people in it) if you live there.
-- Joining and creating houses go through security-definer functions so the
-- 12-room cap and room assignment can't be bypassed from the client.

create extension if not exists pgcrypto;

-- profiles ----------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  city text check (char_length(city) <= 60),
  time_zone text not null default 'UTC',
  created_at timestamptz not null default now()
);

-- make a profile as soon as someone signs up, named after their email
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- houses ------------------------------------------------------------------

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  theme text not null default 'paris' check (theme in ('paris', 'new-york', 'venice', 'tokyo')),
  marquee text[] not null default '{}',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  house_id uuid not null references public.houses on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  room smallint not null check (room between 0 and 11),
  curtains text not null default 'open' check (curtains in ('open', 'drawn')),
  joined_at timestamptz not null default now(),
  primary key (house_id, user_id),
  unique (house_id, room)
);

create table public.invites (
  code text primary key default encode(gen_random_bytes(9), 'hex'),
  house_id uuid not null references public.houses on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- helpers -----------------------------------------------------------------

-- security definer so policies can call it without recursing into memberships' own policy
create function public.is_member(h uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m where m.house_id = h and m.user_id = auth.uid()
  );
$$;

create function public.shares_house_with(other uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships a
    join public.memberships b on a.house_id = b.house_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- row level security ------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;

create policy "see yourself and your housemates" on public.profiles
  for select using (id = auth.uid() or public.shares_house_with(id));
create policy "edit your own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "members can see their house" on public.houses
  for select using (public.is_member(id));
create policy "members can update their house" on public.houses
  for update using (public.is_member(id)) with check (public.is_member(id));

create policy "members can see who lives there" on public.memberships
  for select using (public.is_member(house_id));
create policy "change your own curtains" on public.memberships
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "move out" on public.memberships
  for delete using (user_id = auth.uid());

create policy "members can see invites" on public.invites
  for select using (public.is_member(house_id));
create policy "members can make invites" on public.invites
  for insert with check (public.is_member(house_id) and created_by = auth.uid());
create policy "members can revoke invites" on public.invites
  for delete using (public.is_member(house_id));

-- create / join -----------------------------------------------------------

create function public.create_house(house_name text, house_theme text default 'paris')
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
  insert into public.houses (name, theme, created_by)
  values (house_name, house_theme, auth.uid())
  returning id into new_id;
  insert into public.memberships (house_id, user_id, room) values (new_id, auth.uid(), 0);
  return new_id;
end;
$$;

create function public.join_house(invite_code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  inv public.invites;
  free_room smallint;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select * into inv from public.invites where code = invite_code and expires_at > now();
  if not found then
    raise exception 'that invite has expired or doesn''t exist';
  end if;

  -- already live here? just go home
  if exists (select 1 from public.memberships where house_id = inv.house_id and user_id = auth.uid()) then
    return inv.house_id;
  end if;

  -- lock the house so two people can't grab the last room at once
  perform 1 from public.houses where id = inv.house_id for update;

  select r into free_room
  from generate_series(0, 11) as r
  where r not in (select room from public.memberships where house_id = inv.house_id)
  order by r
  limit 1;

  if free_room is null then
    raise exception 'this house is full (12 rooms)';
  end if;

  insert into public.memberships (house_id, user_id, room) values (inv.house_id, auth.uid(), free_room);
  return inv.house_id;
end;
$$;

revoke execute on function public.create_house(text, text) from anon;
revoke execute on function public.join_house(text) from anon;
