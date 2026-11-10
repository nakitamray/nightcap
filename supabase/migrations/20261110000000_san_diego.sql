-- a fifth street: san diego. the list of themes lives in a check constraint
-- on houses, so adding one means swapping the constraint.

alter table public.houses drop constraint houses_theme_check;

alter table public.houses
  add constraint houses_theme_check
  check (theme in ('paris', 'new-york', 'venice', 'tokyo', 'san-diego'));
