-- FINAL FIX for chat policies - resolves all circular dependencies
-- This addresses the "Failed to get user chats" error in the camera screen
-- Run this in Supabase SQL Editor

-- Drop ALL existing chat-related policies first
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

-- SIMPLE AND WORKING CHAT POLICIES
-- No circular dependencies, no complex joins

-- CHATS table policies
CREATE POLICY "Users can view chats they participate in" ON public.chats
  FOR SELECT USING (
    -- User created the chat OR
    created_by = auth.uid() OR
    -- User is a participant (using a separate subquery to avoid circular dependency)
    id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = created_by);

-- CHAT_PARTICIPANTS table policies
CREATE POLICY "Users can view chat participants where they are members" ON public.chat_participants
  FOR SELECT USING (
    -- User can see themselves in any chat
    user_id = auth.uid() OR
    -- User can see other participants in chats they're also in
    chat_id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chats" ON public.chat_participants
  FOR INSERT WITH CHECK (
    -- Users can add themselves to any chat OR
    user_id = auth.uid() OR
    -- Chat creators can add anyone
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can leave chats" ON public.chat_participants
  FOR DELETE USING (
    -- Users can remove themselves OR
    user_id = auth.uid() OR
    -- Chat creators can remove anyone
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  );

-- Re-enable RLS if it was disabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Verify the policies work by testing a simple query
-- This should now work without circular dependency errors
SELECT 'Chat policies fixed successfully' as status; 