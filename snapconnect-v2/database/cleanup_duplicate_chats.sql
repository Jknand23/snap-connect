-- Clean up duplicate chats created during testing
-- Run this in Supabase SQL Editor to remove duplicate chats

-- First, let's see what we have
SELECT 
  c.id,
  c.name,
  c.type,
  c.created_at,
  COUNT(cp.user_id) as participant_count,
  STRING_AGG(p.username, ', ') as participants
FROM chats c
LEFT JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN profiles p ON cp.user_id = p.id
GROUP BY c.id, c.name, c.type, c.created_at
ORDER BY c.created_at DESC;

-- Delete test chats and chats with no participants
DELETE FROM chats 
WHERE name LIKE '%Test%' 
   OR name LIKE '%test%'
   OR name LIKE '%Demo%'
   OR name LIKE '%demo%'
   OR id NOT IN (
     SELECT DISTINCT chat_id 
     FROM chat_participants 
     WHERE chat_id IS NOT NULL
   );

-- Delete orphaned chat participants (where chat no longer exists)
DELETE FROM chat_participants 
WHERE chat_id NOT IN (SELECT id FROM chats);

-- Delete empty messages from deleted chats
DELETE FROM messages 
WHERE chat_id NOT IN (SELECT id FROM chats);

-- Show remaining chats after cleanup
SELECT 
  c.id,
  c.name,
  c.type,
  c.created_at,
  COUNT(cp.user_id) as participant_count
FROM chats c
LEFT JOIN chat_participants cp ON c.id = cp.chat_id
GROUP BY c.id, c.name, c.type, c.created_at
ORDER BY c.created_at DESC;

SELECT 'Duplicate chats cleaned up!' as status; 