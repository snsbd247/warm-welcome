-- Create reseller_packages table for package access control
CREATE TABLE public.reseller_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reseller_id, package_id)
);

-- Add allow_all_packages toggle to resellers table
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS allow_all_packages boolean NOT NULL DEFAULT false;

-- RLS
ALTER TABLE public.reseller_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_reseller_packages" ON public.reseller_packages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_reseller_packages" ON public.reseller_packages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_reseller_packages" ON public.reseller_packages FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete_reseller_packages" ON public.reseller_packages FOR DELETE TO anon USING (true);

-- Index for fast lookups
CREATE INDEX idx_reseller_packages_reseller ON public.reseller_packages (reseller_id, status);
CREATE INDEX idx_reseller_packages_tenant ON public.reseller_packages (tenant_id);