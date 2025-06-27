-- Enhanced Disappearing Messages System
-- Migration to support sophisticated disappearing messages with view tracking and presence
-- Run this in Supabase SQL Editor

-- Add new columns to messages table for disappearing message tracking
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_disappearing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS viewed_by_recipient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS should_disappear BOOLEAN DEFAULT FALSE;

-- Create message views tracking table
CREATE TABLE IF NOT EXISTS public.message_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, viewer_id)
);

-- Create chat presence tracking table to know who's currently in a chat
CREATE TABLE IF NOT EXISTS public.chat_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(chat_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_views_message_id ON public.message_views(message_id);
CREATE INDEX IF NOT EXISTS idx_message_views_viewer_id ON public.message_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_chat_id ON public.chat_presence(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_user_id ON public.chat_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_disappearing ON public.messages(is_disappearing, should_disappear);

-- Add RLS policies for message views
ALTER TABLE public.message_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own message views" ON public.message_views
  FOR SELECT USING (viewer_id = auth.uid());

CREATE POLICY "Users can create message views" ON public.message_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Add RLS policies for chat presence
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view presence" ON public.chat_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_id = chat_presence.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own presence" ON public.chat_presence
  FOR ALL USING (user_id = auth.uid());

-- Function to mark message as viewed and trigger disappearing logic
CREATE OR REPLACE FUNCTION mark_message_viewed(
  p_message_id UUID,
  p_viewer_id UUID
) RETURNS VOID AS $$
DECLARE
  v_sender_id UUID;
  v_chat_id UUID;
  v_chat_type TEXT;
  v_other_user_id UUID;
  v_is_sender BOOLEAN;
BEGIN
  -- Get message details
  SELECT sender_id, chat_id INTO v_sender_id, v_chat_id
  FROM public.messages
  WHERE id = p_message_id;

  -- Get chat type
  SELECT type INTO v_chat_type
  FROM public.chats
  WHERE id = v_chat_id;

  -- Only process disappearing messages for direct chats
  IF v_chat_type != 'direct' THEN
    RETURN;
  END IF;

  -- Check if viewer is the sender
  v_is_sender := (p_viewer_id = v_sender_id);

  -- Record the view (will be ignored if already exists due to UNIQUE constraint)
  INSERT INTO public.message_views (message_id, viewer_id)
  VALUES (p_message_id, p_viewer_id)
  ON CONFLICT (message_id, viewer_id) DO NOTHING;

  -- If viewer is not the sender, mark message as viewed by recipient
  IF NOT v_is_sender THEN
    UPDATE public.messages
    SET viewed_by_recipient = TRUE, viewed_at = NOW()
    WHERE id = p_message_id AND viewed_by_recipient = FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update chat presence
CREATE OR REPLACE FUNCTION update_chat_presence(
  p_chat_id UUID,
  p_user_id UUID,
  p_is_active BOOLEAN DEFAULT TRUE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.chat_presence (chat_id, user_id, is_active, last_activity)
  VALUES (p_chat_id, p_user_id, p_is_active, NOW())
  ON CONFLICT (chat_id, user_id)
  DO UPDATE SET 
    is_active = p_is_active,
    last_activity = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired disappearing messages (only when users explicitly leave)
CREATE OR REPLACE FUNCTION cleanup_disappearing_messages() RETURNS VOID AS $$
DECLARE
  message_record RECORD;
  v_chat_has_active_users BOOLEAN;
BEGIN
  -- Find messages that should disappear (viewed by recipient and not from sender)
  FOR message_record IN
    SELECT m.id, m.chat_id, m.sender_id
    FROM public.messages m
    JOIN public.chats c ON m.chat_id = c.id
    WHERE m.is_disappearing = TRUE
      AND m.viewed_by_recipient = TRUE
      AND c.type = 'direct'
      AND m.should_disappear = FALSE  -- Not already marked for deletion
  LOOP
    -- Check if anyone is currently marked as active in the chat
    -- Note: We only check is_active flag, not time-based activity
    SELECT EXISTS(
      SELECT 1 FROM public.chat_presence
      WHERE chat_id = message_record.chat_id
        AND is_active = TRUE
    ) INTO v_chat_has_active_users;

    -- Only mark for deletion if no users are actively marked as present
    IF NOT v_chat_has_active_users THEN
      UPDATE public.messages
      SET should_disappear = TRUE
      WHERE id = message_record.id;
      
      -- Log the action for debugging
      RAISE NOTICE 'Marked message % for deletion - all users left chat %', message_record.id, message_record.chat_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to actually delete messages marked for disappearing
CREATE OR REPLACE FUNCTION delete_disappearing_messages() RETURNS VOID AS $$
DECLARE
  message_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Delete messages one by one to ensure real-time events are triggered
  FOR message_record IN
    SELECT id, chat_id
    FROM public.messages
    WHERE should_disappear = TRUE
      AND viewed_by_recipient = TRUE
      AND is_disappearing = TRUE
  LOOP
    -- Delete the individual message (this should trigger real-time events)
    DELETE FROM public.messages WHERE id = message_record.id;
    deleted_count := deleted_count + 1;
    
    -- Log each deletion for debugging
    RAISE NOTICE 'Deleted disappearing message % from chat %', message_record.id, message_record.chat_id;
  END LOOP;
  
  RAISE NOTICE 'Deleted % disappearing messages total', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete cleanup function that handles the full flow safely
CREATE OR REPLACE FUNCTION full_message_cleanup() RETURNS TEXT AS $$
DECLARE
  marked_count INTEGER;
  deleted_count INTEGER;
  result_text TEXT;
BEGIN
  -- Step 1: Mark eligible messages for deletion (only when no users active)
  PERFORM cleanup_disappearing_messages();
  
  -- Count marked messages
  SELECT COUNT(*) INTO marked_count
  FROM public.messages
  WHERE should_disappear = TRUE AND is_disappearing = TRUE;
  
  -- Step 2: Delete marked messages
  PERFORM delete_disappearing_messages();
  
  -- Count what was actually deleted
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Step 3: Clean up old presence records (only inactive ones older than 24 hours)
  DELETE FROM public.chat_presence
  WHERE is_active = FALSE AND last_activity < NOW() - INTERVAL '24 hours';
  
  -- Step 4: Clean up old message views (older than 24 hours)
  DELETE FROM public.message_views
  WHERE viewed_at < NOW() - INTERVAL '24 hours';
  
  result_text := format('Cleanup completed: %s messages marked, %s messages deleted', marked_count, deleted_count);
  RAISE NOTICE '%', result_text;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for messages with view status for easier querying
CREATE OR REPLACE VIEW public.messages_with_status AS
SELECT 
  m.*,
  CASE 
    WHEN m.sender_id = auth.uid() THEN TRUE
    ELSE FALSE
  END as is_own_message,
  mv.viewed_at as user_viewed_at,
  cp.is_active as sender_in_chat,
  cp2.is_active as recipient_in_chat
FROM public.messages m
LEFT JOIN public.message_views mv ON m.id = mv.message_id AND mv.viewer_id = auth.uid()
LEFT JOIN public.chat_presence cp ON m.chat_id = cp.chat_id AND m.sender_id = cp.user_id
LEFT JOIN public.chat_presence cp2 ON m.chat_id = cp2.chat_id AND cp2.user_id != m.sender_id
WHERE EXISTS (
  SELECT 1 FROM public.chat_participants
  WHERE chat_id = m.chat_id AND user_id = auth.uid()
);

-- Update messages table to make disappearing messages the default for direct chats
UPDATE public.messages 
SET is_disappearing = TRUE 
WHERE chat_id IN (
  SELECT id FROM public.chats WHERE type = 'direct'
) AND is_disappearing IS NULL;

SELECT 'Enhanced disappearing messages system setup complete!' as status; 