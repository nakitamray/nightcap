-- trigger functions only ever run from their triggers, never over the api.
-- (postgres doesn't check execute when a trigger fires, so this is safe.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notes_slow_down() from public, anon, authenticated;

-- the policy helpers are for signed-in people only.
revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.shares_house_with(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.shares_house_with(uuid) to authenticated;
