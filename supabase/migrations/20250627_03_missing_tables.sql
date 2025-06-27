-- Missing Tables for Group Messaging
-- Creates the tables needed for ephemeral group messaging functionality

-- Message views tracking table
CREATE TABLE IF NOT EXISTS public.message_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, viewer_id)
);

-- Chat presence tracking table
CREATE TABLE IF NOT EXISTS public.chat_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Add missing columns to messages table for disappearing functionality
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_disappearing BOOLEAN DEFAULT FALSE;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS should_disappear BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_views_message_id ON public.message_views(message_id);
CREATE INDEX IF NOT EXISTS idx_message_views_viewer_id ON public.message_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_chat_id ON public.chat_presence(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_user_id ON public.chat_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_active ON public.chat_presence(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_disappearing ON public.messages(is_disappearing, should_disappear);

-- Enable RLS on new tables
ALTER TABLE public.message_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_views
CREATE POLICY "Users can view message views for their chats" ON public.message_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      JOIN public.messages m ON message_views.message_id = m.id
      WHERE cp.chat_id = m.chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own message views" ON public.message_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- RLS policies for chat_presence
CREATE POLICY "Users can view presence for their chats" ON public.chat_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_presence.chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own presence" ON public.chat_presence
  FOR ALL USING (user_id = auth.uid());

-- Function to update presence timestamp
CREATE OR REPLACE FUNCTION update_chat_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update presence timestamp
CREATE TRIGGER update_chat_presence_updated_at
  BEFORE UPDATE ON public.chat_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_presence_timestamp(); 