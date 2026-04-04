-- Add tenant_id to accounting & business tables for multi-tenant isolation

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.merchant_payments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Assign existing records to SpeedNet BD tenant
UPDATE public.expenses SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;
UPDATE public.sales SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;
UPDATE public.purchases SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;
UPDATE public.products SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;
UPDATE public.accounts SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;
UPDATE public.merchant_payments SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;
UPDATE public.support_tickets SET tenant_id = 'b48f2347-3fc4-402c-87ef-7b977a64e075' WHERE tenant_id IS NULL;