CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'lang-exg');

CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lang-exg' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lang-exg' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lang-exg' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

