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

-- characters ----------------------------------------------------------------------

reset role;
select t.login(:alice);
select t.ok(t.rows($$update public.profiles set avatar = '{"skin": 3, "top": "hoodie"}'
  where id = auth.uid()$$) = 1, 'you can save your character');
select t.fails($$update public.profiles set avatar = jsonb_build_object('junk', repeat('x', 3000))
  where id = auth.uid()$$, 'characters have a size limit');
select t.ok(t.rows($$update public.profiles set avatar = '{}'
  where id = '00000000-0000-0000-0000-00000000000b'$$) = 0, 'you can''t dress up someone else');

-- where you are -------------------------------------------------------------------

reset role;
select t.login(:bob);
select public.here((select house from ids), 'room:3');
select t.ok((select place from public.presence where user_id = auth.uid()) = 'room:3',
  'presence knows which room you''re in');
select public.here((select house from ids), 'lounge');
select t.fails($$select public.here((select house from ids), 'the roof')$$, 'only real places');

-- notes ---------------------------------------------------------------------------

insert into public.notes (house_id, from_user, to_user, body)
  values ((select house from ids), auth.uid(), :alice, 'pizza at 9?');
select t.fails($$insert into public.notes (house_id, from_user, to_user, body)
  values ((select house from ids), '00000000-0000-0000-0000-00000000000a', auth.uid(), 'i owe bob £20')$$,
  'you can''t write a note as someone else');
select t.fails($$insert into public.notes (house_id, from_user, to_user, body)
  values ((select house from ids), auth.uid(), '00000000-0000-0000-0000-00000000000c', 'hi')$$,
  'notes only go to people who live there');
select t.fails($$insert into public.notes (house_id, from_user, to_user, body)
  values ((select house from ids), auth.uid(), '00000000-0000-0000-0000-00000000000a', '   ')$$,
  'a note has to say something');
select t.ok((select count(*) from public.notes) = 1, 'you can see notes you sent');
select t.ok(t.rows($$update public.notes set read_at = now()$$) = 0,
  'you can''t mark your own note read for them');
reset role;
select t.login(:alice);
select t.ok((select body from public.notes) = 'pizza at 9?', 'the note is under alice''s door');
select t.fails($$update public.notes set body = 'no pizza'$$, 'nobody can change what a note says');
select t.ok(t.rows($$update public.notes set read_at = now()$$) = 1, 'you can mark notes read');
reset role;
select t.login(:carol);
select t.ok(not exists (select 1 from public.notes), 'nobody else can read them');
select t.fails($$insert into public.notes (house_id, from_user, to_user, body)
  values ((select house from ids), auth.uid(), '00000000-0000-0000-0000-00000000000a', 'hello')$$,
  'outsiders can''t slip notes in');
reset role;
select t.login(:bob);
insert into public.notes (house_id, from_user, to_user, body)
  select (select house from ids), auth.uid(), :alice, 'note ' || n from generate_series(2, 30) n;
select t.fails($$insert into public.notes (house_id, from_user, to_user, body)
  values ((select house from ids), auth.uid(), '00000000-0000-0000-0000-00000000000a', 'one more')$$,
  'thirty notes a day each');

-- now playing ---------------------------------------------------------------------

insert into public.now_playing (user_id, title, artist, url)
  values (auth.uid(), 'Moon River', 'Audrey Hepburn', 'https://open.spotify.com/track/x');
select t.fails($$insert into public.now_playing (user_id, title, artist)
  values ('00000000-0000-0000-0000-00000000000a', 'Never Gonna Give You Up', 'Rick Astley')$$,
  'you can''t say what someone else is playing');
select t.fails($$update public.now_playing set url = 'https://evil.example/x' where user_id = auth.uid()$$,
  'links only go to spotify');
reset role;
select t.login(:alice);
select t.ok((select title from public.now_playing) = 'Moon River', 'housemates see what you''re playing');
reset role;
select t.login(:carol);
select t.ok(not exists (select 1 from public.now_playing), 'nobody else does');

-- keeping a house -----------------------------------------------------------------

reset role;
select t.login(:dee);
create temp table lonely as select public.create_house('waiting', 'venice') as house;
select public.keep_house((select house from lonely));
select public.keep_house((select house from lonely));
select public.keep_house((select house from lonely));
select t.fails($$select public.keep_house((select house from lonely))$$, 'a house can wait three extra weeks');
reset role;
update public.houses set created_at = now() - interval '8 days' where id = (select house from lonely);
select t.login(:dee);
select public.sweep_lonely_houses();
reset role;
select t.ok(exists (select 1 from public.houses where id = (select house from lonely)),
  'a kept house isn''t swept');
select t.login(:carol);
select t.fails($$select public.keep_house((select house from lonely))$$, 'only people who live there');
reset role;
select t.login(:alice);
select t.fails($$select public.keep_house((select house from ids))$$, 'a shared house doesn''t need it');

-- signed out ----------------------------------------------------------------------

select t.login(null);
select t.fails($$select public.create_house('x', 'paris')$$, 'signed out, you can''t make a house');
select t.fails($$select public.invite_preview('letmein')$$, 'or peek at an invite');
select t.ok(public.username_available('somebody'), 'but you can check a username is free');
