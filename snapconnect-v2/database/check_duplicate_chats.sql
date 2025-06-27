-- Quick check to see duplicate chats in your database
-- Run this in Supabase SQL Editor to see what we're dealing with

-- Show all direct chats with their participants
SELECT 
  c.id,
  c.name,
  c.type,
  c.created_at,
  c.updated_at,
  STRING_AGG(p.username, ' + ' ORDER BY p.username) as participants,
  COUNT(cp.user_id) as participant_count
FROM chats c
LEFT JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE c.type = 'direct'
GROUP BY c.id, c.name, c.type, c.created_at, c.updated_at
ORDER BY participants, c.created_at DESC;

-- Count duplicates by participant pairs
WITH chat_pairs AS (
  SELECT 
    c.id as chat_id,
    c.created_at,
    c.updated_at,
    STRING_AGG(p.username ORDER BY p.username) as participant_names,
    COUNT(cp.user_id) as participant_count
  FROM chats c
  LEFT JOIN chat_participants cp ON c.id = cp.chat_id
  LEFT JOIN profiles p ON cp.user_id = p.id
  WHERE c.type = 'direct'
  GROUP BY c.id, c.created_at, c.updated_at
)
SELECT 
  participant_names,
  COUNT(*) as duplicate_count,
  STRING_AGG(chat_id::text, ', ') as chat_ids
FROM chat_pairs
WHERE participant_count = 2  -- Only direct chats with 2 people
GROUP BY participant_names
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Show total chat counts
SELECT 
  type,
  COUNT(*) as count
FROM chats
GROUP BY type; 