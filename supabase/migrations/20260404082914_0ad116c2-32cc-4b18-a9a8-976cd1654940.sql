-- Add tenant_id to system_settings for multi-tenant ledger mapping
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Drop old unique constraint on setting_key (global)
ALTER TABLE public.system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_key_key;

-- Add composite unique constraint (tenant_id, setting_key)
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_tenant_setting_key UNIQUE (tenant_id, setting_key);

-- Add tenant_id to general_settings for multi-tenant company info
ALTER TABLE public.general_settings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Assign existing system_settings to first tenant (SpeedNet) as default
UPDATE public.system_settings SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;