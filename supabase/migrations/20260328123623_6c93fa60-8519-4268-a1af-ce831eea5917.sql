DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = r.table_name
        AND p.policyname = 'anon_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY anon_access ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true);',
        r.table_name
      );
    END IF;
  END LOOP;
END $$;