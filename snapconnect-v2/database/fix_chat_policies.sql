-- Fix for circular dependency in chat policies
-- Run this in Supabase SQL Editor to fix the infinite recursion error

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Chat participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can add chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can remove themselves from chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can manage participants" ON public.chat_participants;

-- Fixed Chats policies
-- Allow users to view chats they created OR are participants in
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

-- Allow users to create chats (no circular dependency)
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to update chats they created
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = created_by);

-- Fixed Chat participants policies  
-- Allow viewing participants if you're the chat creator OR a participant
CREATE POLICY "Users can view chat participants" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.chat_participants cp2
      WHERE cp2.chat_id = chat_participants.chat_id AND cp2.user_id = auth.uid()
    )
  );

-- Allow inserting participants if you're the chat creator OR adding yourself
CREATE POLICY "Users can add chat participants" ON public.chat_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  );

-- Allow users to remove themselves from chats
CREATE POLICY "Users can remove themselves from chats" ON public.chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Allow chat creators to manage all participants
CREATE POLICY "Chat creators can manage participants" ON public.chat_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  ); 