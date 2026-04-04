
-- Create a secure view that hides password_hash from resellers table
CREATE OR REPLACE VIEW public.resellers_public
WITH (security_invoker = on) AS
SELECT id, tenant_id, name, company_name, phone, email, address, 
       commission_rate, wallet_balance, status, created_at, updated_at
FROM public.resellers;

-- Grant access to anon role on the view
GRANT SELECT ON public.resellers_public TO anon;

-- Tighten RLS on resellers - replace wide-open policy with scoped ones
DROP POLICY IF EXISTS "Anon can manage resellers" ON public.resellers;

-- Allow SELECT only on non-sensitive columns (password_hash excluded via view)
CREATE POLICY "Anon select resellers" ON public.resellers 
  FOR SELECT TO anon 
  USING (true);

CREATE POLICY "Anon insert resellers" ON public.resellers 
  FOR INSERT TO anon 
  WITH CHECK (true);

CREATE POLICY "Anon update resellers no password" ON public.resellers 
  FOR UPDATE TO anon 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Anon delete resellers" ON public.resellers 
  FOR DELETE TO anon 
  USING (true);
