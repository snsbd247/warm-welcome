
-- ISP Fiber Network Topology Tables

-- 1. OLTs table
CREATE TABLE public.fiber_olts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  total_pon_ports INTEGER NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_fiber_olts_tenant ON public.fiber_olts(tenant_id);

-- 2. PON Ports table
CREATE TABLE public.fiber_pon_ports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  olt_id UUID NOT NULL REFERENCES public.fiber_olts(id) ON DELETE CASCADE,
  port_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(olt_id, port_number)
);
CREATE INDEX idx_fiber_pon_ports_tenant ON public.fiber_pon_ports(tenant_id);

-- 3. Fiber Cables table
CREATE TABLE public.fiber_cables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pon_port_id UUID REFERENCES public.fiber_pon_ports(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  total_cores INTEGER NOT NULL DEFAULT 12,
  color TEXT,
  length_meters NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_fiber_cables_tenant ON public.fiber_cables(tenant_id);

-- 4. Fiber Cores table
CREATE TABLE public.fiber_cores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fiber_cable_id UUID NOT NULL REFERENCES public.fiber_cables(id) ON DELETE CASCADE,
  core_number INTEGER NOT NULL,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fiber_cable_id, core_number)
);
CREATE INDEX idx_fiber_cores_tenant ON public.fiber_cores(tenant_id);

-- 5. Splitters table
CREATE TABLE public.fiber_splitters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  core_id UUID NOT NULL UNIQUE REFERENCES public.fiber_cores(id) ON DELETE CASCADE,
  ratio TEXT NOT NULL DEFAULT '1:8',
  location TEXT,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_fiber_splitters_tenant ON public.fiber_splitters(tenant_id);

-- 6. Splitter Outputs table
CREATE TABLE public.fiber_splitter_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  splitter_id UUID NOT NULL REFERENCES public.fiber_splitters(id) ON DELETE CASCADE,
  output_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(splitter_id, output_number)
);
CREATE INDEX idx_fiber_splitter_outputs_tenant ON public.fiber_splitter_outputs(tenant_id);

-- 7. Fiber ONUs table (links to customer)
CREATE TABLE public.fiber_onus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  splitter_output_id UUID UNIQUE REFERENCES public.fiber_splitter_outputs(id) ON DELETE SET NULL,
  serial_number TEXT NOT NULL,
  mac_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  signal_strength TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_fiber_onus_tenant ON public.fiber_onus(tenant_id);

-- RLS Policies
ALTER TABLE public.fiber_olts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_pon_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_cores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_splitters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_splitter_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_onus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_access" ON public.fiber_olts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_olts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_access" ON public.fiber_pon_ports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_pon_ports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_access" ON public.fiber_cables FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_cables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_access" ON public.fiber_cores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_cores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_access" ON public.fiber_splitters FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_splitters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_access" ON public.fiber_splitter_outputs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_splitter_outputs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_access" ON public.fiber_onus FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.fiber_onus FOR ALL TO authenticated USING (true) WITH CHECK (true);
