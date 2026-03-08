
-- Add payment_status to track bKash flow
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS bkash_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS bkash_trx_id TEXT;

-- Allow anon to insert payments (customer portal payments)
CREATE POLICY "Anon can insert payments" ON public.payments
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anon to update payments (callback)
CREATE POLICY "Anon can update payments" ON public.payments
  FOR UPDATE TO anon USING (true);

-- Allow anon to update bills (for marking paid after payment)
CREATE POLICY "Anon can update bills" ON public.bills
  FOR UPDATE TO anon USING (true);
