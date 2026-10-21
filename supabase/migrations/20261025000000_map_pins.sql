-- nightcap: a pin on the map poster
--
-- Only ever a town, rounded to a tenth of a degree (about 10km) by the app
-- before it gets here. Housemates can read it through the existing profiles
-- policy so their pins show up on your poster too.

alter table public.profiles
  add column if not exists lat double precision check (lat between -90 and 90),
  add column if not exists lon double precision check (lon between -180 and 180);

grant update (display_name, city, time_zone, lat, lon) on public.profiles to authenticated;
