-- Simplified fix for chat policies - removes all circular dependencies
-- Run this in Supabase SQL Editor

-- Drop ALL existing chat-related policies
DROP POLICY IF EXISTS "Chat participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can add chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can remove themselves from chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can manage participants" ON public.chat_participants;

-- SIMPLE CHATS POLICIES (no circular dependency)
-- Allow users to create any chat
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to view chats they created (no participant check to avoid recursion)
CREATE POLICY "Chat creators can view their chats" ON public.chats
  FOR SELECT USING (created_by = auth.uid());

-- Allow users to update chats they created
CREATE POLICY "Chat creators can update their chats" ON public.chats
  FOR UPDATE USING (created_by = auth.uid());

-- SIMPLE CHAT PARTICIPANTS POLICIES (no circular dependency)
-- Allow anyone to view participants in chats they're part of
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants
  FOR SELECT USING (user_id = auth.uid());

-- Allow chat creators to add participants
CREATE POLICY "Chat creators can add participants" ON public.chat_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  );

-- Allow users to remove themselves
CREATE POLICY "Users can remove themselves" ON public.chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Temporarily allow broader access for testing
CREATE POLICY "Authenticated users can view all chats" ON public.chats
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all participants" ON public.chat_participants
  FOR SELECT USING (auth.uid() IS NOT NULL); 