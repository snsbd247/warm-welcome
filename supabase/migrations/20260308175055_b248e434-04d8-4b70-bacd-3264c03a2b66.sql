ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mikrotik_sync_status text NOT NULL DEFAULT 'pending';

-- Add mikrotik_profile_name to packages if not exists (already exists per schema)
-- Add router_id to packages for profile sync target
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS router_id uuid REFERENCES public.mikrotik_routers(id) ON DELETE SET NULL;