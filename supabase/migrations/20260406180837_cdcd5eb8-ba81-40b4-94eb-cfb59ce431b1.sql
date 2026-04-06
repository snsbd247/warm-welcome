DROP POLICY IF EXISTS "anon_access" ON public.faqs;
CREATE POLICY "anon_select_faqs" ON public.faqs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_access" ON public.general_settings;
CREATE POLICY "anon_select_general_settings" ON public.general_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_access" ON public.geo_districts;
CREATE POLICY "anon_select_geo_districts" ON public.geo_districts FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_access" ON public.geo_divisions;
CREATE POLICY "anon_select_geo_divisions" ON public.geo_divisions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_access" ON public.geo_upazilas;
CREATE POLICY "anon_select_geo_upazilas" ON public.geo_upazilas FOR SELECT TO anon USING (true);