
-- Add missing anon INSERT/UPDATE/DELETE policies for tables that don't have them yet
-- Tables missing from the first query: modules, plan_modules, reseller_package_commissions,
-- reseller_sessions, reseller_wallet_transactions, sms_transactions, sms_wallets,
-- super_admin_sessions, super_admins

DO $$
DECLARE
  tbl text;
  tbl_list text[] := ARRAY[
    'modules','plan_modules','reseller_package_commissions',
    'reseller_sessions','reseller_wallet_transactions',
    'sms_transactions','sms_wallets','super_admin_sessions','super_admins'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbl_list LOOP
    -- GRANT permissions
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', tbl);

    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Create INSERT policy if not exists
    BEGIN
      EXECUTE format('CREATE POLICY "anon_insert_%s" ON public.%I FOR INSERT TO anon WITH CHECK (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Create UPDATE policy if not exists
    BEGIN
      EXECUTE format('CREATE POLICY "anon_update_%s" ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Create DELETE policy if not exists
    BEGIN
      EXECUTE format('CREATE POLICY "anon_delete_%s" ON public.%I FOR DELETE TO anon USING (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Create SELECT policy if not exists
    BEGIN
      EXECUTE format('CREATE POLICY "anon_select_%s" ON public.%I FOR SELECT TO anon USING (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
