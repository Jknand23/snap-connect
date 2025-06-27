-- Fix messages policies to work with simplified chat policies
-- Run this in Supabase SQL Editor

-- Drop existing problematic messages policies
DROP POLICY IF EXISTS "Chat participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to chats they're in" ON public.messages;

-- Create simplified messages policies that work with real-time subscriptions
-- Allow authenticated users to view messages (we'll rely on app-level security for now)
CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to send messages as themselves
CREATE POLICY "Users can send their own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id); 