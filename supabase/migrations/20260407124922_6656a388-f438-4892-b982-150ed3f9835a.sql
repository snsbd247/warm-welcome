
DO $$
DECLARE
  tbl text;
  pol_exists boolean;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    -- Check and create INSERT policy for anon
    SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = tbl AND cmd = 'INSERT' AND roles @> ARRAY['anon']::name[]) INTO pol_exists;
    IF NOT pol_exists THEN
      -- Check if ALL policy exists for anon
      SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = tbl AND cmd = 'ALL' AND roles @> ARRAY['anon']::name[]) INTO pol_exists;
      IF NOT pol_exists THEN
        EXECUTE format('CREATE POLICY "anon_insert_%s" ON public.%I FOR INSERT TO anon WITH CHECK (true)', tbl, tbl);
      END IF;
    END IF;

    -- Check and create UPDATE policy for anon
    SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = tbl AND cmd = 'UPDATE' AND roles @> ARRAY['anon']::name[]) INTO pol_exists;
    IF NOT pol_exists THEN
      SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = tbl AND cmd = 'ALL' AND roles @> ARRAY['anon']::name[]) INTO pol_exists;
      IF NOT pol_exists THEN
        EXECUTE format('CREATE POLICY "anon_update_%s" ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)', tbl, tbl);
      END IF;
    END IF;

    -- Check and create DELETE policy for anon
    SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = tbl AND cmd = 'DELETE' AND roles @> ARRAY['anon']::name[]) INTO pol_exists;
    IF NOT pol_exists THEN
      SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = tbl AND cmd = 'ALL' AND roles @> ARRAY['anon']::name[]) INTO pol_exists;
      IF NOT pol_exists THEN
        EXECUTE format('CREATE POLICY "anon_delete_%s" ON public.%I FOR DELETE TO anon USING (true)', tbl, tbl);
      END IF;
    END IF;
  END LOOP;
END $$;
