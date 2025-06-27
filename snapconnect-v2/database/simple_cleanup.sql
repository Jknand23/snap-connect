-- Simple cleanup and test script
-- 1. Clean up duplicate group chats (keep only the most recent for each participant set)

WITH group_participants AS (
  SELECT 
    c.id as chat_id,
    c.created_at,
    array_agg(cp.user_id ORDER BY cp.user_id) as participant_ids
  FROM chats c
  JOIN chat_participants cp ON c.id = cp.chat_id
  WHERE c.type = 'group'
  GROUP BY c.id, c.created_at
),
ranked_groups AS (
  SELECT 
    chat_id,
    participant_ids,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY participant_ids 
      ORDER BY created_at DESC
    ) as rn
  FROM group_participants
),
chats_to_delete AS (
  SELECT chat_id
  FROM ranked_groups
  WHERE rn > 1
)
DELETE FROM chats 
WHERE id IN (SELECT chat_id FROM chats_to_delete);

-- 2. Show remaining group chats
SELECT 
  c.id,
  c.name,
  c.created_at,
  array_agg(cp.user_id ORDER BY cp.user_id) as participant_ids,
  array_agg(p.username ORDER BY cp.user_id) as participant_names
FROM chats c
JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE c.type = 'group'
GROUP BY c.id, c.name, c.created_at
ORDER BY c.created_at DESC;

-- 3. Test disappearing messages by marking all messages as viewed and cleaning up

-- First, mark all group messages as viewed by all participants
INSERT INTO message_views (message_id, viewer_id)
SELECT DISTINCT m.id, cp.user_id
FROM messages m
JOIN chats c ON m.chat_id = c.id
JOIN chat_participants cp ON c.id = cp.chat_id
WHERE c.type = 'group'
  AND NOT EXISTS (
    SELECT 1 FROM message_views mv 
    WHERE mv.message_id = m.id AND mv.viewer_id = cp.user_id
  );

-- Set all chat presence to inactive
INSERT INTO chat_presence (chat_id, user_id, is_active, last_activity)
SELECT DISTINCT c.id, cp.user_id, false, NOW()
FROM chats c
JOIN chat_participants cp ON c.id = cp.chat_id
WHERE c.type = 'group'
ON CONFLICT (chat_id, user_id) 
DO UPDATE SET is_active = false, last_activity = NOW();

-- Now call the cleanup function
SELECT cleanup_group_disappearing_messages() as messages_deleted;

-- Show what's left
SELECT 
  m.id,
  m.content,
  m.chat_id,
  c.name as chat_name,
  m.is_disappearing,
  m.should_disappear,
  (SELECT COUNT(*) FROM message_views mv WHERE mv.message_id = m.id) as view_count,
  (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = m.chat_id) as total_participants
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE c.type = 'group'
ORDER BY m.created_at DESC; 