-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Add pppoe_password_hash column to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS pppoe_password_hash text;

-- Hash all existing plaintext passwords using bcrypt
UPDATE public.customers
SET pppoe_password_hash = extensions.crypt(pppoe_password, extensions.gen_salt('bf', 12))
WHERE pppoe_password IS NOT NULL AND pppoe_password != '' AND pppoe_password_hash IS NULL;