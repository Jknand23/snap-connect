-- Group Messaging Functions
-- SQL functions to support ephemeral group messaging where messages disappear
-- only after ALL group members have viewed them

-- Function to mark a group message as viewed by a specific user
CREATE OR REPLACE FUNCTION mark_group_message_viewed(
  p_message_id UUID,
  p_viewer_id UUID
) RETURNS VOID AS $$
DECLARE
  v_sender_id UUID;
  v_chat_id UUID;
  v_chat_type TEXT;
  v_total_participants INTEGER;
  v_view_count INTEGER;
BEGIN
  -- Get message details
  SELECT sender_id, chat_id INTO v_sender_id, v_chat_id
  FROM public.messages
  WHERE id = p_message_id;

  -- Get chat type
  SELECT type INTO v_chat_type
  FROM public.chats
  WHERE id = v_chat_id;

  -- Only process group messages
  IF v_chat_type != 'group' THEN
    RETURN;
  END IF;

  -- Record the view (will be ignored if already exists due to UNIQUE constraint)
  INSERT INTO public.message_views (message_id, viewer_id)
  VALUES (p_message_id, p_viewer_id)
  ON CONFLICT (message_id, viewer_id) DO NOTHING;

  -- Count total participants in the group
  SELECT COUNT(*) INTO v_total_participants
  FROM public.chat_participants
  WHERE chat_id = v_chat_id;

  -- Count how many have viewed this message
  SELECT COUNT(*) INTO v_view_count
  FROM public.message_views
  WHERE message_id = p_message_id;

  -- Log for debugging
  RAISE NOTICE 'Group message % viewed by user %. Total participants: %, Views: %', 
    p_message_id, p_viewer_id, v_total_participants, v_view_count;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if all group members have viewed a message and mark for disappearance
CREATE OR REPLACE FUNCTION check_group_message_disappearance(
  p_message_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_chat_id UUID;
  v_chat_type TEXT;
  v_total_participants INTEGER;
  v_view_count INTEGER;
  v_has_active_users BOOLEAN;
  v_should_disappear BOOLEAN := FALSE;
BEGIN
  -- Get message and chat info
  SELECT chat_id INTO v_chat_id
  FROM public.messages
  WHERE id = p_message_id;

  SELECT type INTO v_chat_type
  FROM public.chats
  WHERE id = v_chat_id;

  -- Only process group messages
  IF v_chat_type != 'group' THEN
    RETURN FALSE;
  END IF;

  -- Count total participants in the group
  SELECT COUNT(*) INTO v_total_participants
  FROM public.chat_participants
  WHERE chat_id = v_chat_id;

  -- Count how many have viewed this message
  SELECT COUNT(*) INTO v_view_count
  FROM public.message_views mv
  JOIN public.chat_participants cp ON mv.viewer_id = cp.user_id
  WHERE mv.message_id = p_message_id AND cp.chat_id = v_chat_id;

  -- Check if there are any active users in the chat
  SELECT EXISTS(
    SELECT 1 FROM public.chat_presence
    WHERE chat_id = v_chat_id
      AND is_active = TRUE
  ) INTO v_has_active_users;

  -- Message can disappear if all participants have viewed it AND no one is actively in chat
  IF v_view_count >= v_total_participants AND NOT v_has_active_users THEN
    -- Mark message for disappearance
    UPDATE public.messages
    SET should_disappear = TRUE
    WHERE id = p_message_id AND should_disappear = FALSE;
    
    v_should_disappear := TRUE;
    
    RAISE NOTICE 'Marked group message % for deletion - all % participants viewed, no active users', 
      p_message_id, v_total_participants;
  END IF;

  RETURN v_should_disappear;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup group messages that are ready to disappear
CREATE OR REPLACE FUNCTION cleanup_group_disappearing_messages(
  p_chat_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  message_record RECORD;
  v_total_participants INTEGER;
  v_view_count INTEGER;
  v_has_active_users BOOLEAN;
  deleted_count INTEGER := 0;
BEGIN
  -- Process messages in specific chat or all group chats
  FOR message_record IN
    SELECT m.id, m.chat_id, m.sender_id
    FROM public.messages m
    JOIN public.chats c ON m.chat_id = c.id
    WHERE m.is_disappearing = TRUE
      AND m.should_disappear = FALSE
      AND c.type = 'group'
      AND (p_chat_id IS NULL OR m.chat_id = p_chat_id)
  LOOP
    -- Count total participants in this group
    SELECT COUNT(*) INTO v_total_participants
    FROM public.chat_participants
    WHERE chat_id = message_record.chat_id;

    -- Count views for this message from group participants
    SELECT COUNT(*) INTO v_view_count
    FROM public.message_views mv
    JOIN public.chat_participants cp ON mv.viewer_id = cp.user_id
    WHERE mv.message_id = message_record.id 
      AND cp.chat_id = message_record.chat_id;

    -- Check if anyone is currently active in the chat
    SELECT EXISTS(
      SELECT 1 FROM public.chat_presence
      WHERE chat_id = message_record.chat_id
        AND is_active = TRUE
    ) INTO v_has_active_users;

    -- Mark for deletion if all members viewed and no one is active
    IF v_view_count >= v_total_participants AND NOT v_has_active_users THEN
      UPDATE public.messages
      SET should_disappear = TRUE
      WHERE id = message_record.id;
      
      RAISE NOTICE 'Marked group message % for deletion - all % participants viewed, no active users',
        message_record.id, v_total_participants;
    END IF;
  END LOOP;

  -- Actually delete messages marked for disappearing
  FOR message_record IN
    SELECT id, chat_id
    FROM public.messages
    WHERE should_disappear = TRUE
      AND is_disappearing = TRUE
      AND (p_chat_id IS NULL OR chat_id = p_chat_id)
  LOOP
    -- Delete the individual message (triggers real-time events)
    DELETE FROM public.messages WHERE id = message_record.id;
    deleted_count := deleted_count + 1;
    
    RAISE NOTICE 'Deleted group message % from chat %', message_record.id, message_record.chat_id;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get group message statistics
CREATE OR REPLACE FUNCTION get_group_message_stats(
  p_chat_id UUID
) RETURNS TABLE (
  total_messages INTEGER,
  total_participants INTEGER,
  messages_pending_disappear INTEGER,
  average_view_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total messages in the group
    (SELECT COUNT(*)::INTEGER
     FROM public.messages m
     JOIN public.chats c ON m.chat_id = c.id
     WHERE m.chat_id = p_chat_id AND c.type = 'group' AND m.is_disappearing = TRUE),
    
    -- Total participants in the group
    (SELECT COUNT(*)::INTEGER
     FROM public.chat_participants
     WHERE chat_id = p_chat_id),
    
    -- Messages pending disappearance (all participants viewed but still present)
    (SELECT COUNT(*)::INTEGER
     FROM public.messages m
     WHERE m.chat_id = p_chat_id 
       AND m.is_disappearing = TRUE 
       AND m.should_disappear = FALSE
       AND (SELECT COUNT(*) FROM public.message_views mv 
            JOIN public.chat_participants cp ON mv.viewer_id = cp.user_id
            WHERE mv.message_id = m.id AND cp.chat_id = p_chat_id) = 
           (SELECT COUNT(*) FROM public.chat_participants WHERE chat_id = p_chat_id)),
    
    -- Average view percentage across all messages
    (SELECT COALESCE(AVG(
      (SELECT COUNT(*)::NUMERIC FROM public.message_views mv 
       JOIN public.chat_participants cp ON mv.viewer_id = cp.user_id
       WHERE mv.message_id = m.id AND cp.chat_id = p_chat_id) / 
      NULLIF((SELECT COUNT(*) FROM public.chat_participants WHERE chat_id = p_chat_id), 0) * 100
    ), 0)
     FROM public.messages m
     WHERE m.chat_id = p_chat_id AND m.is_disappearing = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending viewers for a specific message
CREATE OR REPLACE FUNCTION get_message_pending_viewers(
  p_message_id UUID
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id,
    p.username,
    p.avatar_url
  FROM public.chat_participants cp
  JOIN public.profiles p ON cp.user_id = p.id
  WHERE cp.chat_id = (SELECT chat_id FROM public.messages WHERE id = p_message_id)
    AND cp.user_id NOT IN (
      SELECT viewer_id 
      FROM public.message_views 
      WHERE message_id = p_message_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to force cleanup of all group messages (for maintenance)
CREATE OR REPLACE FUNCTION force_cleanup_all_group_messages() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Mark all eligible messages for deletion
  UPDATE public.messages
  SET should_disappear = TRUE
  WHERE is_disappearing = TRUE
    AND should_disappear = FALSE
    AND chat_id IN (SELECT id FROM public.chats WHERE type = 'group')
    AND id IN (
      SELECT m.id
      FROM public.messages m
      WHERE (SELECT COUNT(*) FROM public.message_views mv 
             JOIN public.chat_participants cp ON mv.viewer_id = cp.user_id
             WHERE mv.message_id = m.id AND cp.chat_id = m.chat_id) = 
            (SELECT COUNT(*) FROM public.chat_participants WHERE chat_id = m.chat_id)
    );

  -- Delete marked messages
  WITH deleted AS (
    DELETE FROM public.messages 
    WHERE should_disappear = TRUE AND is_disappearing = TRUE
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 