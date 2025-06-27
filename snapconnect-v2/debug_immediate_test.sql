-- Immediate Diagnostic Test for Disappearing Messages
-- Run this in Supabase SQL Editor to see what's happening

-- Step 1: Check all disappearing messages currently in the system
SELECT 
  m.id,
  m.content,
  m.sender_id,
  m.chat_id,
  m.is_disappearing,
  m.viewed_by_recipient,
  m.viewed_at,
  m.should_disappear,
  c.type as chat_type,
  m.created_at
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE m.is_disappearing = TRUE
ORDER BY m.created_at DESC
LIMIT 10;

-- Step 2: Check all message views
SELECT 
  mv.message_id,
  mv.viewer_id,
  mv.viewed_at,
  m.sender_id,
  m.content,
  CASE 
    WHEN mv.viewer_id = m.sender_id THEN 'SENDER_VIEW'
    ELSE 'RECIPIENT_VIEW'
  END as view_type
FROM message_views mv
JOIN messages m ON mv.message_id = m.id
WHERE m.is_disappearing = TRUE
ORDER BY mv.viewed_at DESC
LIMIT 10;

-- Step 3: Check all chat presence records
SELECT 
  cp.chat_id,
  cp.user_id,
  cp.is_active,
  cp.last_activity,
  p.username
FROM chat_presence cp
JOIN profiles p ON cp.user_id = p.id
ORDER BY cp.last_activity DESC
LIMIT 10;

-- Step 4: Test the cleanup logic manually on ALL eligible messages
DO $$
DECLARE
  message_record RECORD;
  presence_record RECORD;
  v_chat_has_active_users BOOLEAN;
  eligible_count INTEGER := 0;
  marked_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== TESTING CLEANUP LOGIC ===';
  
  -- Find all messages that should be eligible for cleanup
  FOR message_record IN
    SELECT m.id, m.chat_id, m.sender_id, m.content, c.type
    FROM public.messages m
    JOIN public.chats c ON m.chat_id = c.id
    WHERE m.is_disappearing = TRUE
      AND m.viewed_by_recipient = TRUE
      AND c.type = 'direct'
      AND m.should_disappear = FALSE
  LOOP
    eligible_count := eligible_count + 1;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Checking message %: "%"', message_record.id, message_record.content;
    RAISE NOTICE '  Chat ID: %', message_record.chat_id;
    RAISE NOTICE '  Chat Type: %', message_record.type;
    
    -- Check if anyone is currently marked as active in the chat
    SELECT EXISTS(
      SELECT 1 FROM public.chat_presence
      WHERE chat_id = message_record.chat_id
        AND is_active = TRUE
    ) INTO v_chat_has_active_users;
    
    RAISE NOTICE '  Has Active Users: %', v_chat_has_active_users;
    
    -- Show all presence records for this chat
    FOR presence_record IN 
      SELECT user_id, is_active, last_activity 
      FROM chat_presence 
      WHERE chat_id = message_record.chat_id
    LOOP
      RAISE NOTICE '    User: %, Active: %, Last Activity: %', 
        presence_record.user_id, 
        presence_record.is_active, 
        presence_record.last_activity;
    END LOOP;
    
    -- Check if message should be marked for deletion
    IF NOT v_chat_has_active_users THEN
      RAISE NOTICE '  ✅ MESSAGE SHOULD BE MARKED FOR DELETION';
      marked_count := marked_count + 1;
      
      -- Actually mark it for deletion
      UPDATE public.messages
      SET should_disappear = TRUE
      WHERE id = message_record.id;
      
      RAISE NOTICE '  ✅ Message marked for deletion';
    ELSE
      RAISE NOTICE '  ❌ Message will NOT be deleted (active users present)';
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Eligible messages found: %', eligible_count;
  RAISE NOTICE 'Messages marked for deletion: %', marked_count;
  
  -- Now actually delete marked messages
  DELETE FROM public.messages
  WHERE should_disappear = TRUE
    AND viewed_by_recipient = TRUE
    AND is_disappearing = TRUE;
    
  GET DIAGNOSTICS marked_count = ROW_COUNT;
  RAISE NOTICE 'Messages actually deleted: %', marked_count;
END $$;

-- Step 5: Check final state
SELECT 
  'FINAL CHECK' as status,
  COUNT(*) as remaining_disappearing_messages
FROM messages 
WHERE is_disappearing = TRUE 
  AND viewed_by_recipient = TRUE 
  AND should_disappear = FALSE;

-- Step 6: Show any messages that are marked for deletion but still exist
SELECT 
  m.id,
  m.content,
  m.should_disappear,
  m.viewed_by_recipient,
  m.is_disappearing,
  'MARKED_BUT_NOT_DELETED' as status
FROM messages m
WHERE m.should_disappear = TRUE
  AND m.is_disappearing = TRUE;

SELECT 'Diagnostic complete. Check the NOTICES above for detailed analysis.' as result; 