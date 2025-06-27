-- Debug: Check Storage Configuration
-- Run this in Supabase SQL Editor to diagnose storage issues

-- Check if media bucket exists
SELECT 
  'BUCKET CHECK' as test_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'media';

-- Check all buckets (if media doesn't exist)
SELECT 
  'ALL BUCKETS' as test_type,
  id,
  name,
  public,
  created_at
FROM storage.buckets;

-- Check storage policies for media bucket
SELECT 
  'STORAGE POLICIES' as test_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Check if RLS is enabled on storage.objects
SELECT 
  'RLS STATUS' as test_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Test bucket access for current user (if authenticated)
SELECT 
  'BUCKET ACCESS TEST' as test_type,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'User is authenticated: ' || auth.uid()::text
    ELSE 'User is NOT authenticated'
  END as auth_status;

-- Show storage.objects table structure
SELECT 
  'OBJECTS TABLE STRUCTURE' as test_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
ORDER BY ordinal_position; 