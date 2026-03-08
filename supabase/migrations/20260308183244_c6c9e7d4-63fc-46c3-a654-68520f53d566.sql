
-- Create customer_ledger table
CREATE TABLE public.customer_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  type TEXT NOT NULL DEFAULT 'adjustment',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage ledger"
  ON public.customer_ledger FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Staff can view ledger"
  ON public.customer_ledger FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anon can read ledger"
  ON public.customer_ledger FOR SELECT
  TO anon
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_customer_ledger_customer_id ON public.customer_ledger(customer_id);
CREATE INDEX idx_customer_ledger_date ON public.customer_ledger(date);

-- Trigger: auto-create ledger entry when a bill is inserted
CREATE OR REPLACE FUNCTION public.ledger_on_bill_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev_balance NUMERIC;
BEGIN
  SELECT COALESCE(
    (SELECT balance FROM customer_ledger WHERE customer_id = NEW.customer_id ORDER BY date DESC, created_at DESC LIMIT 1),
    0
  ) INTO prev_balance;

  INSERT INTO customer_ledger (customer_id, date, description, debit, credit, balance, reference, type)
  VALUES (
    NEW.customer_id,
    NEW.created_at,
    'Monthly Internet Bill (' || NEW.month || ')',
    NEW.amount,
    0,
    prev_balance + NEW.amount,
    'BILL-' || LEFT(NEW.id::text, 8),
    'bill'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ledger_on_bill_insert
  AFTER INSERT ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.ledger_on_bill_insert();

-- Trigger: auto-create ledger entry when a payment is inserted
CREATE OR REPLACE FUNCTION public.ledger_on_payment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev_balance NUMERIC;
BEGIN
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    (SELECT balance FROM customer_ledger WHERE customer_id = NEW.customer_id ORDER BY date DESC, created_at DESC LIMIT 1),
    0
  ) INTO prev_balance;

  INSERT INTO customer_ledger (customer_id, date, description, debit, credit, balance, reference, type)
  VALUES (
    NEW.customer_id,
    NEW.paid_at,
    'Payment Received (' || NEW.payment_method || ')',
    0,
    NEW.amount,
    prev_balance - NEW.amount,
    COALESCE('TXN-' || NEW.transaction_id, 'PAY-' || LEFT(NEW.id::text, 8)),
    'payment'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ledger_on_payment_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.ledger_on_payment_insert();
