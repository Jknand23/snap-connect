-- Test Script for Disappearing Messages System
-- Run this in Supabase SQL Editor to debug the system

-- Step 1: Check if all functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'mark_message_viewed',
    'update_chat_presence', 
    'cleanup_disappearing_messages',
    'delete_disappearing_messages',
    'full_message_cleanup',
    'mark_group_message_viewed',
    'cleanup_group_disappearing_messages'
  );

-- Step 2: Check current disappearing messages
SELECT 
  m.id,
  m.content,
  m.sender_id,
  m.chat_id,
  m.is_disappearing,
  m.viewed_by_recipient,
  m.viewed_at,
  m.should_disappear,
  m.created_at,
  c.type as chat_type
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE m.is_disappearing = TRUE
ORDER BY m.created_at DESC
LIMIT 10;

-- Step 3: Check message views
SELECT 
  mv.*,
  m.content,
  m.sender_id
FROM message_views mv
JOIN messages m ON mv.message_id = m.id
ORDER BY mv.viewed_at DESC
LIMIT 10;

-- Step 4: Check chat presence
SELECT 
  cp.*,
  p.username
FROM chat_presence cp
JOIN profiles p ON cp.user_id = p.id
ORDER BY cp.last_activity DESC
LIMIT 10;

-- Step 5: Test cleanup function manually
SELECT public.full_message_cleanup() as cleanup_result;

-- Step 6: Check messages after cleanup
SELECT 
  m.id,
  m.content,
  m.is_disappearing,
  m.viewed_by_recipient,
  m.should_disappear,
  CASE 
    WHEN m.should_disappear THEN 'MARKED FOR DELETION'
    WHEN m.viewed_by_recipient THEN 'VIEWED BUT NOT DELETED'
    ELSE 'NOT VIEWED'
  END as status
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE m.is_disappearing = TRUE
  AND c.type = 'direct'
ORDER BY m.created_at DESC
LIMIT 10;

-- Step 7: Check for any errors in recent function calls
-- (This will show any error messages from the functions)
SELECT 'Test completed - check results above' as status;

-- Test Disappearing Messages Functionality
-- This script tests and debugs the group message disappearing system

-- 1. Check current group messages and their view status
SELECT 
  m.id,
  m.content,
  m.chat_id,
  m.sender_id,
  m.is_disappearing,
  m.should_disappear,
  m.created_at,
  c.name as chat_name,
  p.username as sender_username
FROM messages m
JOIN chats c ON m.chat_id = c.id
LEFT JOIN profiles p ON m.sender_id = p.id
WHERE c.type = 'group'
ORDER BY m.created_at DESC;

-- 2. Check message views for group messages
SELECT 
  m.id as message_id,
  m.content,
  m.chat_id,
  mv.viewer_id,
  p.username as viewer_username,
  mv.viewed_at
FROM messages m
JOIN chats c ON m.chat_id = c.id
LEFT JOIN message_views mv ON m.id = mv.message_id
LEFT JOIN profiles p ON mv.viewer_id = p.id
WHERE c.type = 'group'
ORDER BY m.created_at DESC, mv.viewed_at;

-- 3. Check chat participants for group chats
SELECT 
  c.id as chat_id,
  c.name as chat_name,
  cp.user_id,
  p.username,
  cp.role
FROM chats c
JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE c.type = 'group'
ORDER BY c.created_at DESC, p.username;

-- 4. Check chat presence (who's currently active)
SELECT 
  cp.chat_id,
  c.name as chat_name,
  cp.user_id,
  p.username,
  cp.is_active,
  cp.last_activity
FROM chat_presence cp
JOIN chats c ON cp.chat_id = c.id
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE c.type = 'group'
ORDER BY cp.last_activity DESC;

-- 5. Test the mark_group_message_viewed function for each message
-- (This will be run for each message that exists)
DO $$
DECLARE
    message_record RECORD;
    participant_record RECORD;
BEGIN
    -- For each group message, mark it as viewed by all participants
    FOR message_record IN 
        SELECT m.id, m.chat_id
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE c.type = 'group'
        ORDER BY m.created_at DESC
    LOOP
        RAISE NOTICE 'Processing message: %', message_record.id;
        
        -- Mark as viewed by each participant
        FOR participant_record IN
            SELECT cp.user_id
            FROM chat_participants cp
            WHERE cp.chat_id = message_record.chat_id
        LOOP
            RAISE NOTICE 'Marking message % as viewed by user %', message_record.id, participant_record.user_id;
            
            -- Call the function to mark as viewed
            PERFORM mark_group_message_viewed(message_record.id, participant_record.user_id);
        END LOOP;
    END LOOP;
END $$;

-- 6. Set all chat presence to inactive (simulate everyone leaving)
UPDATE chat_presence 
SET is_active = false, 
    last_activity = NOW()
WHERE chat_id IN (
    SELECT id FROM chats WHERE type = 'group'
);

-- 7. Run cleanup function to remove fully-viewed messages
SELECT cleanup_group_disappearing_messages() as messages_deleted;

-- 8. Check what messages remain after cleanup
SELECT 
  m.id,
  m.content,
  m.chat_id,
  m.is_disappearing,
  m.should_disappear,
  c.name as chat_name,
  p.username as sender_username,
  (SELECT COUNT(*) FROM message_views mv WHERE mv.message_id = m.id) as view_count,
  (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = m.chat_id) as total_participants
FROM messages m
JOIN chats c ON m.chat_id = c.id
LEFT JOIN profiles p ON m.sender_id = p.id
WHERE c.type = 'group'
ORDER BY m.created_at DESC; 