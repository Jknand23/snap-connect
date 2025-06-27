-- Aggressive cleanup of duplicate direct chats between same users
-- This will keep only the most recent chat between each pair of users

-- First, let's see what duplicate direct chats we have
WITH chat_pairs AS (
  SELECT 
    c.id as chat_id,
    c.created_at,
    c.updated_at,
    ARRAY(
      SELECT cp.user_id 
      FROM chat_participants cp 
      WHERE cp.chat_id = c.id 
      ORDER BY cp.user_id
    ) as user_pair
  FROM chats c
  WHERE c.type = 'direct'
),
duplicates AS (
  SELECT 
    user_pair,
    COUNT(*) as chat_count,
    ARRAY_AGG(chat_id ORDER BY updated_at DESC) as chat_ids,
    ARRAY_AGG(created_at ORDER BY updated_at DESC) as created_dates
  FROM chat_pairs
  GROUP BY user_pair
  HAVING COUNT(*) > 1
)
SELECT 
  user_pair,
  chat_count,
  chat_ids,
  created_dates
FROM duplicates
ORDER BY chat_count DESC;

-- Now delete all but the most recent chat for each user pair
WITH chat_pairs AS (
  SELECT 
    c.id as chat_id,
    c.created_at,
    c.updated_at,
    ARRAY(
      SELECT cp.user_id 
      FROM chat_participants cp 
      WHERE cp.chat_id = c.id 
      ORDER BY cp.user_id
    ) as user_pair
  FROM chats c
  WHERE c.type = 'direct'
),
duplicates AS (
  SELECT 
    user_pair,
    ARRAY_AGG(chat_id ORDER BY updated_at DESC) as chat_ids
  FROM chat_pairs
  GROUP BY user_pair
  HAVING COUNT(*) > 1
),
chats_to_delete AS (
  SELECT 
    UNNEST(chat_ids[2:]) as chat_id_to_delete
  FROM duplicates
)
DELETE FROM chats 
WHERE id IN (SELECT chat_id_to_delete FROM chats_to_delete);

-- Clean up orphaned participants and messages
DELETE FROM chat_participants 
WHERE chat_id NOT IN (SELECT id FROM chats);

DELETE FROM messages 
WHERE chat_id NOT IN (SELECT id FROM chats);

-- Show what's left
SELECT 
  c.id,
  c.type,
  c.created_at,
  ARRAY_AGG(p.username ORDER BY p.username) as participants
FROM chats c
LEFT JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE c.type = 'direct'
GROUP BY c.id, c.type, c.created_at
ORDER BY c.created_at DESC;

SELECT 'Duplicate direct chats cleaned up!' as status; 