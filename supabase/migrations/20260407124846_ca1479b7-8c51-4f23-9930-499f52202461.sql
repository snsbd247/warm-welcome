
-- Add anon write policies for general_settings
CREATE POLICY "anon_insert_general_settings" ON public.general_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_general_settings" ON public.general_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_general_settings" ON public.general_settings FOR DELETE TO anon USING (true);

-- Add anon write policies for system_settings (INSERT already exists)
-- Check and add missing ones
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='system_settings' AND policyname='anon_delete_system_settings') THEN
    CREATE POLICY "anon_delete_system_settings" ON public.system_settings FOR DELETE TO anon USING (true);
  END IF;
END $$;
