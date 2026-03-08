
-- Tighten anon policies: restrict to specific customer_id checks
-- The edge function will handle payment operations with service role key

DROP POLICY IF EXISTS "Anon can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Anon can update payments" ON public.payments;
DROP POLICY IF EXISTS "Anon can update bills" ON public.bills;

-- No anon write policies needed - edge function uses service role key
