-- Let signed-in people actually use the tables.
--
-- Newer Supabase projects don't hand out table privileges automatically, so
-- without these every read is "permission denied" (and the house page 404s).
-- Row level security still decides *which* rows anyone sees; this only lets
-- the signed-in role through the door. Signed-out visitors get nothing.

grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.houses to authenticated;
grant select, update, delete on public.memberships to authenticated;
grant select, insert, delete on public.invites to authenticated;

grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.shares_house_with(uuid) to authenticated;
grant execute on function public.create_house(text, text) to authenticated;
grant execute on function public.join_house(text) to authenticated;

-- and keep signed-out visitors away from the functions entirely
revoke execute on function public.create_house(text, text) from public, anon;
revoke execute on function public.join_house(text) from public, anon;
