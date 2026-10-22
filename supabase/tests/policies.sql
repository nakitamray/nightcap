-- The rules the app relies on for privacy and limits, checked as real users
-- would hit them: signed in as one person at a time, through row level
-- security and the same functions the app calls. Run with tests/run.sh.

\set ON_ERROR_STOP 1
set client_min_messages = notice;

-- a few helpers ---------------------------------------------------------------

create schema t;
grant usage on schema t to anon, authenticated;

-- sign in as someone (call `reset role` first to switch people)
create function t.login(who uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(who::text, ''), false);
  perform set_config('role', case when who is null then 'anon' else 'authenticated' end, false);
end;
$$;

create function t.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is not true then
    raise exception 'not ok - %', what;
  end if;
  raise notice 'ok - %', what;
end;
$$;

-- the statement has to error; whatever it did is rolled back either way
create function t.fails(statement text, what text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    raise notice 'ok - % (%)', what, sqlerrm;
    return;
  end;
  raise exception 'not ok - % (it worked)', what;
end;
$$;

-- how many rows an update or delete actually touched
create function t.rows(statement text) returns int language plpgsql as $$
declare
  n int;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on all functions in schema t to anon, authenticated;

-- people ------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com', '{"username": "alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{"username": "bob"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@example.com', '{"username": "carol"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dee@example.com', '{"username": "dee"}');

\set alice '''00000000-0000-0000-0000-00000000000a'''
\set bob '''00000000-0000-0000-0000-00000000000b'''
\set carol '''00000000-0000-0000-0000-00000000000c'''
\set dee '''00000000-0000-0000-0000-00000000000d'''

select t.ok((select count(*) from public.profiles) = 4, 'signing up makes a profile');

-- alice makes a house and invites bob ---------------------------------------

select t.login(:alice);
create temp table ids as select public.create_house('the flat', 'paris') as house;
grant select on ids to authenticated, anon;
select t.ok((select room from public.memberships where house_id = (select house from ids)) is null,
  'a new house starts you without a room');
insert into public.invites (code, house_id, created_by)
  values ('letmein', (select house from ids), :alice);
reset role;
insert into public.invites (code, house_id, created_by, expires_at)
  values ('stale', (select house from ids), :alice, now() - interval '1 day');

select t.login(:bob);
select t.ok((select house_name from public.invite_preview('letmein')) = 'the flat',
  'an invite shows which house it is before you join');
select t.ok(not exists (select 1 from public.invite_preview('stale')), 'expired invites show nothing');
select t.ok(not exists (select 1 from public.houses), 'you can''t see a house before you join');
select t.ok(public.join_house('letmein') = (select house from ids), 'joining with an invite');
select t.ok((select count(*) from public.memberships) = 2, 'members see who lives there');

-- claiming rooms --------------------------------------------------------------

reset role;
select t.login(:alice);
select public.claim_room((select house from ids), 3::smallint);
reset role;
select t.login(:bob);
select t.fails($$select public.claim_room((select house from ids), 3::smallint)$$,
  'two people can''t claim the same room');
select public.claim_room((select house from ids), 4::smallint);
select t.fails($$update public.memberships set room = 3 where user_id = auth.uid()$$,
  'room numbers only change through claim_room');

-- your room is yours ------------------------------------------------------------

select t.ok(t.rows($$update public.memberships set curtains = 'drawn'
  where user_id = '00000000-0000-0000-0000-00000000000a'$$) = 0,
  'you can''t draw someone else''s curtains');
select t.ok(t.rows($$update public.memberships set layout = '{"wall": "#000000"}'
  where user_id = '00000000-0000-0000-0000-00000000000a'$$) = 0,
  'you can''t redecorate someone else''s room');
select t.ok(t.rows($$update public.memberships set curtains = 'drawn' where user_id = auth.uid()$$) = 1,
  'you can draw your own curtains');
select t.fails($$update public.memberships set layout = jsonb_build_object('junk', repeat('x', 9000))
  where user_id = auth.uid()$$, 'layouts have a size limit');
select t.fails($$update public.memberships set layout = '[1, 2, 3]' where user_id = auth.uid()$$,
  'a layout has to be an object');

-- the house itself --------------------------------------------------------------

select t.fails($$update public.houses set name = 'mine now'$$, 'members can''t rename the house');
select t.fails($$update public.houses set marquee = '{HACKED}'$$, 'members can''t change the marquee');
select t.fails($$update public.houses set created_by = auth.uid()$$, 'members can''t rewrite created_by');

-- profiles and pins -------------------------------------------------------------

select t.ok(t.rows($$update public.profiles set city = 'nowhere'
  where id = '00000000-0000-0000-0000-00000000000a'$$) = 0,
  'you can''t edit a housemate''s profile');
select t.fails($$update public.profiles set username = 'bobby' where id = auth.uid()$$,
  'usernames don''t change');
update public.profiles set lat = 41.878113, lon = -87.629799 where id = auth.uid();
select t.ok((select lat = 41.9 and lon = -87.6 from public.profiles where id = auth.uid()),
  'map pins are rounded to the town by the database');
select t.fails($$update public.profiles set lat = 91 where id = auth.uid()$$, 'latitude stays on the earth');

-- outsiders ---------------------------------------------------------------------

reset role;
select t.login(:carol);
select t.ok(not exists (select 1 from public.houses), 'outsiders can''t see the house');
select t.ok(not exists (select 1 from public.memberships), 'outsiders can''t see who lives there');
select t.ok(not exists (select 1 from public.profiles where id <> auth.uid()),
  'outsiders can''t see anyone else''s profile');
select t.ok(not exists (select 1 from public.invites), 'outsiders can''t see invites');
select t.fails($$select public.house_count('00000000-0000-0000-0000-00000000000a')$$,
  'nobody can count someone else''s houses');
select t.fails($$select public.claim_room((select house from ids), 5::smallint)$$,
  'outsiders can''t claim a room');
select t.fails($$insert into public.invites (house_id, created_by)
  values ((select house from ids), auth.uid())$$, 'outsiders can''t make invites');

-- who's home ----------------------------------------------------------------------

select t.fails($$select public.here((select house from ids))$$, 'outsiders can''t say they''re home');
reset role;
select t.login(:bob);
select public.here((select house from ids));
select t.fails($$insert into public.presence (house_id, user_id, seen_at)
  values ((select house from ids), '00000000-0000-0000-0000-00000000000a', now() + interval '1 year')$$,
  'nobody can write presence directly');
select t.fails($$update public.presence set seen_at = now() + interval '1 year'$$,
  'nobody can push their own light on into the future');
reset role;
select t.login(:alice);
select t.ok((select count(*) from public.presence) = 1, 'housemates see who''s home');
reset role;
select t.login(:carol);
select t.ok(not exists (select 1 from public.presence), 'outsiders don''t');

-- the live channel ----------------------------------------------------------------

reset role;
insert into realtime.messages (topic, payload)
  select 'house:' || house, '{}' from ids;
create function t.can_listen(topic text) returns boolean language plpgsql as $$
begin
  perform set_config('realtime.topic', topic, false);
  return exists (select 1 from realtime.messages where messages.topic = can_listen.topic);
end;
$$;
grant execute on function t.can_listen(text) to authenticated;

select t.login(:bob);
select t.ok(t.can_listen('house:' || (select house from ids)), 'members can join the house channel');
select t.fails($$insert into realtime.messages (topic, payload)
  values ('house:' || (select house from ids), '{"curtains": "drawn"}')$$,
  'nobody can broadcast on the house channel');
reset role;
select t.login(:carol);
select t.ok(not t.can_listen('house:' || (select house from ids)), 'outsiders can''t join it');
select t.ok(not t.can_listen('house:not-a-uuid'), 'a made-up topic is just a no');

-- limits --------------------------------------------------------------------------

reset role;
select t.login(:dee);
select public.create_house('one', 'paris');
select public.create_house('two', 'tokyo');
select public.create_house('three', 'venice');
select public.create_house('four', 'new-york');
select public.create_house('five', 'paris');
select t.fails($$select public.create_house('six', 'paris')$$, 'five houses each');
select t.fails($$select public.join_house('letmein')$$, 'even by joining');

-- a house nobody joined within a week goes away; one with two people stays
reset role;
update public.houses set created_at = now() - interval '8 days';
select t.login(:dee);
select public.sweep_lonely_houses();
reset role;
select t.ok((select count(*) from public.houses where created_by = :dee) = 0, 'lonely houses are swept');
select t.ok(exists (select 1 from public.houses where id = (select house from ids)), 'shared ones stay');

-- signed out ----------------------------------------------------------------------

select t.login(null);
select t.fails($$select public.create_house('x', 'paris')$$, 'signed out, you can''t make a house');
select t.fails($$select public.invite_preview('letmein')$$, 'or peek at an invite');
select t.ok(public.username_available('somebody'), 'but you can check a username is free');
