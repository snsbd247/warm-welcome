
-- Create merchant_payments table
CREATE TABLE public.merchant_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  sender_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'unmatched',
  matched_customer_id UUID REFERENCES public.customers(id),
  matched_bill_id UUID REFERENCES public.bills(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage merchant payments"
ON public.merchant_payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Staff can view merchant payments"
ON public.merchant_payments FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

-- Index for fast lookups
CREATE INDEX idx_merchant_payments_reference ON public.merchant_payments(reference);
CREATE INDEX idx_merchant_payments_status ON public.merchant_payments(status);
CREATE INDEX idx_merchant_payments_transaction_id ON public.merchant_payments(transaction_id);

-- Auto-match function
CREATE OR REPLACE FUNCTION public.auto_match_merchant_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  matched_cust RECORD;
  matched_bill RECORD;
  prev_balance NUMERIC;
BEGIN
  -- Try to find customer by reference (customer_id field)
  IF NEW.reference IS NOT NULL AND NEW.reference != '' THEN
    SELECT * INTO matched_cust FROM customers
    WHERE customer_id = UPPER(TRIM(NEW.reference)) AND status = 'active'
    LIMIT 1;

    IF FOUND THEN
      -- Try to find matching unpaid bill
      SELECT * INTO matched_bill FROM bills
      WHERE customer_id = matched_cust.id
        AND status = 'unpaid'
        AND amount = NEW.amount
      ORDER BY created_at ASC
      LIMIT 1;

      IF FOUND THEN
        -- Mark bill as paid
        UPDATE bills SET status = 'paid', paid_date = NOW() WHERE id = matched_bill.id;

        -- Create payment record
        INSERT INTO payments (customer_id, bill_id, amount, payment_method, transaction_id, status, paid_at, month)
        VALUES (matched_cust.id, matched_bill.id, NEW.amount, 'bkash_merchant', NEW.transaction_id, 'completed', NEW.payment_date, matched_bill.month);

        -- Update merchant payment as matched
        NEW.status := 'matched';
        NEW.matched_customer_id := matched_cust.id;
        NEW.matched_bill_id := matched_bill.id;
      ELSE
        -- Customer found but no matching bill
        NEW.status := 'manual_review';
        NEW.matched_customer_id := matched_cust.id;
        NEW.notes := COALESCE(NEW.notes, '') || 'Customer found but no matching unpaid bill for amount ' || NEW.amount;
      END IF;
    ELSE
      NEW.status := 'unmatched';
      NEW.notes := COALESCE(NEW.notes, '') || 'No customer found with ID: ' || NEW.reference;
    END IF;
  ELSE
    NEW.status := 'unmatched';
    NEW.notes := COALESCE(NEW.notes, '') || 'No reference/customer ID provided';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_match_merchant_payment
BEFORE INSERT ON public.merchant_payments
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_merchant_payment();
