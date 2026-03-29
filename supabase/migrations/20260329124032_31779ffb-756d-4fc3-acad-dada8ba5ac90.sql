
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS upazila text,
  ADD COLUMN IF NOT EXISTS perm_division text,
  ADD COLUMN IF NOT EXISTS perm_district text,
  ADD COLUMN IF NOT EXISTS perm_upazila text,
  ADD COLUMN IF NOT EXISTS perm_village text,
  ADD COLUMN IF NOT EXISTS perm_road text,
  ADD COLUMN IF NOT EXISTS perm_house text,
  ADD COLUMN IF NOT EXISTS perm_post_office text;
