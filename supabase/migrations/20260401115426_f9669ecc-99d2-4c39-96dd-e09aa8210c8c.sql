
INSERT INTO public.super_admins (name, email, username, password_hash, status)
VALUES ('Super Admin', 'superadmin@smartispapp.com', 'superadmin', '$2b$10$yBEupjl4I4Mhj3VgYUdX1uaGcmQSiawQc/Q7snMyA4pltg0XoN4Ju', 'active')
ON CONFLICT (username) DO NOTHING;
