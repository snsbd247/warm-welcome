
CREATE POLICY "anon_insert" ON public.system_settings
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "anon_update" ON public.system_settings
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);
