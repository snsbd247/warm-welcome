
-- Fix generate_customer_id function search path
CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.customers;
  NEW.customer_id := 'ISP-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;
