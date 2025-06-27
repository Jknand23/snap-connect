-- Cleanup Duplicate Group Chats
-- This script removes duplicate group chats that have the same participants,
-- keeping only the most recent one for each unique group

-- First, let's see what we have
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

-- Delete duplicate group chats, keeping only the most recent one for each unique participant set
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

-- Show remaining group chats after cleanup
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