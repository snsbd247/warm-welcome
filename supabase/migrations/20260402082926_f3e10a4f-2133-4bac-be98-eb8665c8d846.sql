ALTER TABLE public.ip_pools ADD COLUMN IF NOT EXISTS type text DEFAULT 'pppoe';
ALTER TABLE public.ip_pools ADD COLUMN IF NOT EXISTS ranges text;
ALTER TABLE public.ip_pools ADD COLUMN IF NOT EXISTS mikrotik_id text;
CREATE INDEX IF NOT EXISTS idx_ip_pools_router_id_name ON public.ip_pools (router_id, name);
CREATE INDEX IF NOT EXISTS idx_ip_pools_type ON public.ip_pools (type);