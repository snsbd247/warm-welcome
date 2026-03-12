CREATE TABLE public.platform_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  smtp_host text,
  smtp_port text DEFAULT '587',
  smtp_username text,
  smtp_password text,
  smtp_encryption text DEFAULT 'tls',
  smtp_from_email text,
  smtp_from_name text,
  smtp_status text DEFAULT 'not_connected',
  smtp_last_connected_at timestamptz,
  
  bkash_app_key text,
  bkash_app_secret text,
  bkash_username text,
  bkash_password text,
  bkash_base_url text DEFAULT 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  bkash_environment text DEFAULT 'sandbox',
  bkash_status text DEFAULT 'not_connected',
  bkash_last_connected_at timestamptz,
  
  nagad_api_key text,
  nagad_api_secret text,
  nagad_base_url text DEFAULT 'https://sandbox.mynagad.com:10061/remote-payment-gateway-1.0/api/dfs',
  nagad_status text DEFAULT 'not_connected',
  nagad_last_connected_at timestamptz,
  
  sms_gateway_url text,
  sms_api_key text,
  sms_sender_id text,
  sms_status text DEFAULT 'not_connected',
  sms_last_connected_at timestamptz,
  
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_access" ON public.platform_integrations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert a single default row
INSERT INTO public.platform_integrations (id) VALUES (gen_random_uuid());