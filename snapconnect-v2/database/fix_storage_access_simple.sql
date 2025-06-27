-- Simple Storage Access Fix
-- Run this in Supabase SQL Editor with standard user permissions

-- Only create policies (don't modify buckets table directly)
-- The bucket should be created manually through the Supabase Dashboard

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Media files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to media files" ON storage.objects;

-- Create storage.objects policies for media bucket
CREATE POLICY "Users can upload media files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Media files are publicly accessible" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'media');

CREATE POLICY "Users can update their own media files" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media files" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to media files (for image URLs)
CREATE POLICY "Public read access to media files" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'media');

-- Verify the policies were created
SELECT 
  'Storage policies created' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%media%';

-- Check if media bucket exists (read-only check)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media') 
    THEN 'Media bucket exists ✅'
    ELSE 'Media bucket NOT found ❌ - Create it manually in Dashboard'
  END as bucket_status; 