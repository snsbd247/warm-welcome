-- Activity Logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Login Histories table
CREATE TABLE IF NOT EXISTS public.login_histories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID,
    ip_address TEXT,
    device TEXT,
    browser TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Impersonations table
CREATE TABLE IF NOT EXISTS public.impersonations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    target_user_id UUID,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_access" ON public.activity_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_access" ON public.login_histories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.login_histories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_access" ON public.impersonations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON public.impersonations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON public.activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_histories_tenant ON public.login_histories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_histories_user ON public.login_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_login_histories_created ON public.login_histories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonations_token ON public.impersonations(token);
CREATE INDEX IF NOT EXISTS idx_impersonations_tenant ON public.impersonations(tenant_id);