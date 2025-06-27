-- Fix Storage Access Issues
-- Run this in Supabase SQL Editor to fix bucket listing and access

-- First, ensure the media bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.buckets if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to see all public buckets
DROP POLICY IF EXISTS "Allow authenticated users to see public buckets" ON storage.buckets;
CREATE POLICY "Allow authenticated users to see public buckets" ON storage.buckets
FOR SELECT TO authenticated USING (public = true);

-- Create policy to allow service role to see all buckets
DROP POLICY IF EXISTS "Allow service role to see all buckets" ON storage.buckets;
CREATE POLICY "Allow service role to see all buckets" ON storage.buckets
FOR ALL TO service_role USING (true);

-- Ensure storage.objects policies are correct
DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Media files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

-- Create comprehensive storage.objects policies
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

-- Verify the setup
SELECT 
  'Storage setup verification' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'media') as media_bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'buckets' AND schemaname = 'storage') as bucket_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') as object_policies;

-- Show current bucket configuration
SELECT 
  'Current bucket config' as info,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'media'; 