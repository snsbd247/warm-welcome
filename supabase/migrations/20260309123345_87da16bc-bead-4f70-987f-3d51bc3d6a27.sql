-- Create customer_sessions table for secure session management
CREATE TABLE public.customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 hours')
);

ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role should access this table (via edge functions)
-- No RLS policies needed for anon/authenticated since customers don't use Supabase Auth

-- Drop unused password column from customers
ALTER TABLE public.customers DROP COLUMN IF EXISTS password;