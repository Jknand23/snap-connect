-- Diagnostic Script for Disappearing Messages Issue
-- Run this in Supabase SQL Editor to check the exact state

-- Check the specific message that was tested
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
  'MESSAGE STATE' as section
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE m.id = '0387f1b5-be11-4057-803b-dfa1ae743dd8'

UNION ALL

-- Check chat presence for this chat
SELECT 
  cp.chat_id::text as id,
  p.username as content,
  cp.user_id as sender_id,
  cp.chat_id,
  cp.is_active as is_disappearing,
  NULL as viewed_by_recipient,
  cp.last_activity as viewed_at,
  NULL as should_disappear,
  'presence' as chat_type,
  'CHAT PRESENCE' as section
FROM chat_presence cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.chat_id = (
  SELECT chat_id FROM messages WHERE id = '0387f1b5-be11-4057-803b-dfa1ae743dd8'
)

UNION ALL

-- Check message views for this message
SELECT 
  mv.message_id::text as id,
  p.username as content,
  mv.viewer_id as sender_id,
  NULL as chat_id,
  NULL as is_disappearing,
  NULL as viewed_by_recipient,
  mv.viewed_at,
  NULL as should_disappear,
  'view' as chat_type,
  'MESSAGE VIEWS' as section
FROM message_views mv
JOIN profiles p ON mv.viewer_id = p.id
WHERE mv.message_id = '0387f1b5-be11-4057-803b-dfa1ae743dd8';

-- Test the cleanup logic manually for this specific message
DO $$
DECLARE
  test_message_id UUID := '0387f1b5-be11-4057-803b-dfa1ae743dd8';
  test_chat_id UUID;
  v_chat_has_active_users BOOLEAN;
  v_is_disappearing BOOLEAN;
  v_viewed_by_recipient BOOLEAN;
  v_should_disappear BOOLEAN;
  v_chat_type TEXT;
BEGIN
  -- Get message details
  SELECT 
    chat_id, 
    is_disappearing, 
    viewed_by_recipient, 
    should_disappear 
  INTO 
    test_chat_id, 
    v_is_disappearing, 
    v_viewed_by_recipient, 
    v_should_disappear
  FROM messages 
  WHERE id = test_message_id;
  
  -- Get chat type
  SELECT type INTO v_chat_type FROM chats WHERE id = test_chat_id;
  
  RAISE NOTICE 'Message Details:';
  RAISE NOTICE '  ID: %', test_message_id;
  RAISE NOTICE '  Chat ID: %', test_chat_id;
  RAISE NOTICE '  Chat Type: %', v_chat_type;
  RAISE NOTICE '  Is Disappearing: %', v_is_disappearing;
  RAISE NOTICE '  Viewed by Recipient: %', v_viewed_by_recipient;
  RAISE NOTICE '  Should Disappear: %', v_should_disappear;
  
  -- Check if anyone is currently marked as active in the chat
  SELECT EXISTS(
    SELECT 1 FROM public.chat_presence
    WHERE chat_id = test_chat_id
      AND is_active = TRUE
  ) INTO v_chat_has_active_users;
  
  RAISE NOTICE 'Active Users Check:';
  RAISE NOTICE '  Has Active Users: %', v_chat_has_active_users;
  
  -- Show all presence records for this chat
  FOR r IN (
    SELECT user_id, is_active, last_activity 
    FROM chat_presence 
    WHERE chat_id = test_chat_id
  ) LOOP
    RAISE NOTICE '  User: %, Active: %, Last Activity: %', r.user_id, r.is_active, r.last_activity;
  END LOOP;
  
  -- Check if message meets cleanup criteria
  IF v_is_disappearing = TRUE 
     AND v_viewed_by_recipient = TRUE 
     AND v_chat_type = 'direct' 
     AND v_should_disappear = FALSE 
     AND NOT v_chat_has_active_users THEN
    RAISE NOTICE 'MESSAGE SHOULD BE MARKED FOR DELETION';
  ELSE
    RAISE NOTICE 'MESSAGE DOES NOT MEET DELETION CRITERIA:';
    RAISE NOTICE '  Is Disappearing: % (should be TRUE)', v_is_disappearing;
    RAISE NOTICE '  Viewed by Recipient: % (should be TRUE)', v_viewed_by_recipient;
    RAISE NOTICE '  Chat Type: % (should be direct)', v_chat_type;
    RAISE NOTICE '  Should Disappear: % (should be FALSE)', v_should_disappear;
    RAISE NOTICE '  Has Active Users: % (should be FALSE)', v_chat_has_active_users;
  END IF;
END $$; 