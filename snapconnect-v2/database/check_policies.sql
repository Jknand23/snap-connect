-- Check current RLS policies for chat tables
-- Run this in Supabase SQL Editor to verify policies are correctly applied

-- Check if RLS is enabled on tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'chat_participants', 'messages');

-- Check existing policies on chats table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'chats'
ORDER BY policyname;

-- Check existing policies on chat_participants table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'chat_participants'
ORDER BY policyname;

-- Test if current user can access tables (run after authentication)
-- This should show your user ID
SELECT auth.uid() as current_user_id;

-- Test basic access to chat_participants table
SELECT COUNT(*) as participant_count 
FROM public.chat_participants 
WHERE user_id = auth.uid();

-- Test basic access to chats table  
SELECT COUNT(*) as chat_count 
FROM public.chats 
WHERE created_by = auth.uid();

-- Check if there are any participants at all (should work if RLS is working)
SELECT COUNT(*) as total_participants 
FROM public.chat_participants; 