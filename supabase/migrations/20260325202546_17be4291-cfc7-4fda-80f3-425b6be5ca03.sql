UPDATE public.profiles
SET password_hash = '$2b$12$9LatBU20hFdSDZGabrEEeODBVEPvmiMxQSsE/Cu9r0zbKQj6u/Wcy',
    updated_at = now()
WHERE username = 'ismail';