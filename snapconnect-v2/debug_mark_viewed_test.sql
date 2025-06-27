-- Test the mark_message_viewed function
-- Run this in Supabase SQL Editor

-- First, check the current state of the test message
SELECT 
  id,
  content,
  sender_id,
  is_disappearing,
  viewed_by_recipient,
  viewed_at
FROM messages 
WHERE id = '0387f1b5-be11-4057-803b-dfa1ae743dd8';

-- Check if there are message views for this message
SELECT 
  mv.*,
  p.username
FROM message_views mv
JOIN profiles p ON mv.viewer_id = p.id
WHERE mv.message_id = '0387f1b5-be11-4057-803b-dfa1ae743dd8';

-- Test marking the message as viewed by the sender (this should NOT mark viewed_by_recipient)
-- Replace 'your_user_id' with the actual sender_id from the message above
DO $$
DECLARE
  test_message_id UUID := '0387f1b5-be11-4057-803b-dfa1ae743dd8';
  sender_user_id UUID;
BEGIN
  -- Get the sender ID
  SELECT sender_id INTO sender_user_id FROM messages WHERE id = test_message_id;
  
  RAISE NOTICE 'Testing mark_message_viewed with sender as viewer...';
  RAISE NOTICE 'Message ID: %', test_message_id;
  RAISE NOTICE 'Sender ID: %', sender_user_id;
  
  -- Call the function with sender as viewer (should not mark as viewed by recipient)
  PERFORM mark_message_viewed(test_message_id, sender_user_id);
  
  RAISE NOTICE 'Function called. Checking results...';
END $$;

-- Check the state after calling the function
SELECT 
  id,
  content,
  sender_id,
  is_disappearing,
  viewed_by_recipient,
  viewed_at,
  'AFTER MARK_VIEWED' as status
FROM messages 
WHERE id = '0387f1b5-be11-4057-803b-dfa1ae743dd8';

-- The issue is likely that in your test, you're marking the message as viewed by the SENDER
-- But viewed_by_recipient should only be TRUE when marked by the RECIPIENT (not sender)
-- Let's simulate marking it as viewed by a different user

-- First, let's see who the participants are in this chat
SELECT 
  cp.*,
  p.username
FROM chat_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.chat_id = (
  SELECT chat_id FROM messages WHERE id = '0387f1b5-be11-4057-803b-dfa1ae743dd8'
);

-- Now let's manually mark the message as viewed by the recipient (not sender)
DO $$
DECLARE
  test_message_id UUID := '0387f1b5-be11-4057-803b-dfa1ae743dd8';
  sender_user_id UUID;
  recipient_user_id UUID;
  test_chat_id UUID;
BEGIN
  -- Get message and chat details
  SELECT sender_id, chat_id INTO sender_user_id, test_chat_id 
  FROM messages WHERE id = test_message_id;
  
  -- Get the recipient (the other participant who is not the sender)
  SELECT user_id INTO recipient_user_id
  FROM chat_participants 
  WHERE chat_id = test_chat_id 
    AND user_id != sender_user_id
  LIMIT 1;
  
  RAISE NOTICE 'Testing mark_message_viewed with recipient as viewer...';
  RAISE NOTICE 'Message ID: %', test_message_id;
  RAISE NOTICE 'Sender ID: %', sender_user_id;
  RAISE NOTICE 'Recipient ID: %', recipient_user_id;
  
  IF recipient_user_id IS NOT NULL THEN
    -- Call the function with recipient as viewer (should mark as viewed by recipient)
    PERFORM mark_message_viewed(test_message_id, recipient_user_id);
    RAISE NOTICE 'Function called with recipient. This should mark viewed_by_recipient = TRUE';
  ELSE
    RAISE NOTICE 'No recipient found - this might be a single-user chat';
  END IF;
END $$;

-- Check final state
SELECT 
  id,
  content,
  sender_id,
  is_disappearing,
  viewed_by_recipient,
  viewed_at,
  'FINAL STATE' as status
FROM messages 
WHERE id = '0387f1b5-be11-4057-803b-dfa1ae743dd8'; 