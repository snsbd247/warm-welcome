CREATE TABLE IF NOT EXISTS public.customer_bandwidth_usages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    zone_id uuid REFERENCES public.reseller_zones(id) ON DELETE SET NULL,
    upload_mb numeric NOT NULL DEFAULT 0,
    download_mb numeric NOT NULL DEFAULT 0,
    total_mb numeric NOT NULL DEFAULT 0,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(customer_id, date)
);

CREATE INDEX idx_bw_tenant_date ON public.customer_bandwidth_usages(tenant_id, date);
CREATE INDEX idx_bw_zone_date ON public.customer_bandwidth_usages(zone_id, date);
CREATE INDEX idx_bw_reseller_date ON public.customer_bandwidth_usages(reseller_id, date);
CREATE INDEX idx_bw_customer ON public.customer_bandwidth_usages(customer_id);

ALTER TABLE public.customer_bandwidth_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to bandwidth_usages" ON public.customer_bandwidth_usages
    FOR ALL USING (true) WITH CHECK (true);