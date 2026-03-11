
-- Create system_settings key-value table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_access" ON public.system_settings
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.system_settings
  FOR SELECT TO anon
  USING (true);

-- Insert default footer settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('footer_text', '© {year} ISP Billing System. All Rights Reserved.'),
  ('company_name', 'ISP Billing System'),
  ('footer_link', ''),
  ('footer_developer', 'Md Ismail Hosain'),
  ('system_version', '1.0.0'),
  ('auto_update_year', 'true');

-- Insert footer permission
INSERT INTO public.permissions (module, action, description) VALUES
  ('settings', 'manage_footer', 'Manage footer settings');
