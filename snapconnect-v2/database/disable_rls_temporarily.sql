-- EMERGENCY FIX: Temporarily disable RLS for chat tables
-- This should ONLY be used for testing - re-enable RLS for production!

-- Disable RLS on chat tables temporarily
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (they won't be needed with RLS disabled)
DROP POLICY IF EXISTS "Chat participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can add chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can remove themselves from chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can manage participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Chat creators can update their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can remove themselves" ON public.chat_participants;
DROP POLICY IF EXISTS "Authenticated users can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can view all participants" ON public.chat_participants;

-- NOTE: Remember to re-enable RLS and add proper policies for production:
-- ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY; 