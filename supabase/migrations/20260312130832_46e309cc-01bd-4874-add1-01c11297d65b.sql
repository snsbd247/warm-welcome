
CREATE TABLE public.tenant_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- SMTP
  smtp_host text,
  smtp_port text DEFAULT '587',
  smtp_username text,
  smtp_password text,
  smtp_encryption text DEFAULT 'tls',
  smtp_from_email text,
  smtp_from_name text,
  
  -- bKash
  bkash_app_key text,
  bkash_app_secret text,
  bkash_username text,
  bkash_password text,
  bkash_base_url text,
  bkash_environment text DEFAULT 'sandbox',
  
  -- Nagad
  nagad_api_key text,
  nagad_api_secret text,
  nagad_base_url text,
  
  -- SMS
  sms_gateway_url text,
  sms_api_key text,
  sms_sender_id text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id)
);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_access" ON public.tenant_integrations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
