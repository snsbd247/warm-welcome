CREATE POLICY "allow_public_upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "allow_public_update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "allow_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');

CREATE POLICY "allow_public_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'avatars');