
GRANT SELECT, INSERT, UPDATE, DELETE ON public.general_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.general_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.general_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO service_role;
