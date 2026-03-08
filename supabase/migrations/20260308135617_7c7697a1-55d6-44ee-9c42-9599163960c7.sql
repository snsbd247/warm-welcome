
-- Create a function that auto-reactivates customer PPPoE after payment
CREATE OR REPLACE FUNCTION public.handle_payment_reactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cust RECORD;
  overdue_count INTEGER;
BEGIN
  -- Only act on completed payments
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Mark the related bill as paid if bill_id is set
  IF NEW.bill_id IS NOT NULL THEN
    UPDATE bills SET status = 'paid', paid_date = NOW() WHERE id = NEW.bill_id AND status = 'unpaid';
  END IF;

  -- Get the customer
  SELECT * INTO cust FROM customers WHERE id = NEW.customer_id;
  IF NOT FOUND OR cust.connection_status != 'suspended' THEN
    RETURN NEW;
  END IF;

  -- Check if customer still has overdue unpaid bills
  SELECT COUNT(*) INTO overdue_count
  FROM bills
  WHERE customer_id = NEW.customer_id
    AND status = 'unpaid'
    AND due_date < CURRENT_DATE;

  -- If no more overdue bills, mark for reactivation
  IF overdue_count = 0 THEN
    UPDATE customers
    SET connection_status = 'pending_reactivation', status = 'active'
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on payments table
DROP TRIGGER IF EXISTS trigger_payment_reactivation ON payments;
CREATE TRIGGER trigger_payment_reactivation
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_reactivation();
