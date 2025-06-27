-- SnapConnect V2 - Manual Database Cleanup Script
-- Run this in your Supabase Dashboard SQL Editor

-- ============================================
-- PART 0: CREATE MISSING TABLES
-- ============================================

-- Message views tracking table
CREATE TABLE IF NOT EXISTS public.message_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, viewer_id)
);

-- Chat presence tracking table
CREATE TABLE IF NOT EXISTS public.chat_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Add missing columns to messages table for disappearing functionality
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_disappearing BOOLEAN DEFAULT FALSE;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS should_disappear BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_views_message_id ON public.message_views(message_id);
CREATE INDEX IF NOT EXISTS idx_message_views_viewer_id ON public.message_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_chat_id ON public.chat_presence(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_user_id ON public.chat_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_active ON public.chat_presence(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_disappearing ON public.messages(is_disappearing, should_disappear);

-- Enable RLS on new tables
ALTER TABLE public.message_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_views
DROP POLICY IF EXISTS "Users can view message views for their chats" ON public.message_views;
CREATE POLICY "Users can view message views for their chats" ON public.message_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      JOIN public.messages m ON message_views.message_id = m.id
      WHERE cp.chat_id = m.chat_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own message views" ON public.message_views;
CREATE POLICY "Users can insert their own message views" ON public.message_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- RLS policies for chat_presence
DROP POLICY IF EXISTS "Users can view presence for their chats" ON public.chat_presence;
CREATE POLICY "Users can view presence for their chats" ON public.chat_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_presence.chat_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage their own presence" ON public.chat_presence;
CREATE POLICY "Users can manage their own presence" ON public.chat_presence
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- PART 1: REMOVE DUPLICATE GROUP CHATS
-- ============================================

-- Remove duplicate group chats (keep only the most recent for each participant set)
WITH duplicate_groups AS (
  SELECT 
    c.id,
    c.name,
    c.created_at,
    array_agg(cp.user_id ORDER BY cp.user_id) as participant_ids,
    ROW_NUMBER() OVER (
      PARTITION BY array_agg(cp.user_id ORDER BY cp.user_id), c.name 
      ORDER BY c.created_at DESC
    ) as rn
  FROM chats c
  JOIN chat_participants cp ON c.id = cp.chat_id
  WHERE c.type = 'group'
  GROUP BY c.id, c.name, c.created_at
)
DELETE FROM chats 
WHERE id IN (
  SELECT id FROM duplicate_groups WHERE rn > 1
);

-- ============================================
-- PART 2: MARK ALL MESSAGES AS VIEWED
-- ============================================

-- Mark all existing messages as viewed by all participants
INSERT INTO message_views (message_id, user_id, viewed_at)
SELECT DISTINCT m.id, cp.user_id, NOW()
FROM messages m
JOIN chat_participants cp ON m.chat_id = cp.chat_id
WHERE NOT EXISTS (
  SELECT 1 FROM message_views mv 
  WHERE mv.message_id = m.id AND mv.user_id = cp.user_id
)
ON CONFLICT (message_id, user_id) DO NOTHING;

-- ============================================
-- PART 3: SET ALL USERS AS INACTIVE
-- ============================================

-- Set all users as inactive in chat presence
UPDATE chat_presence 
SET is_active = false, 
    last_seen = NOW() 
WHERE is_active = true;

-- ============================================
-- PART 4: TRIGGER CLEANUP PROCESS
-- ============================================

-- Force cleanup of all eligible disappearing messages
SELECT force_cleanup_all_group_messages();

-- ============================================
-- PART 5: VERIFICATION QUERIES
-- ============================================

-- Check remaining group chats
SELECT 
  c.id,
  c.name,
  c.created_at,
  COUNT(cp.user_id) as participant_count,
  array_agg(p.username ORDER BY p.username) as participants
FROM chats c
JOIN chat_participants cp ON c.id = cp.chat_id
JOIN profiles p ON cp.user_id = p.id
WHERE c.type = 'group'
GROUP BY c.id, c.name, c.created_at
ORDER BY c.created_at DESC;

-- Check messages that should have disappeared
SELECT 
  m.id,
  m.content,
  m.created_at,
  c.name as chat_name,
  p.username as sender,
  (
    SELECT COUNT(*) 
    FROM chat_participants cp2 
    WHERE cp2.chat_id = m.chat_id
  ) as total_participants,
  (
    SELECT COUNT(*) 
    FROM message_views mv 
    WHERE mv.message_id = m.id
  ) as viewed_by_count
FROM messages m
JOIN chats c ON m.chat_id = c.id
JOIN profiles p ON m.sender_id = p.id
WHERE c.type = 'group'
ORDER BY m.created_at DESC
LIMIT 20;

-- Check chat presence status
SELECT 
  cp.user_id,
  p.username,
  cp.chat_id,
  c.name as chat_name,
  cp.is_active,
  cp.last_seen
FROM chat_presence cp
JOIN profiles p ON cp.user_id = p.id
JOIN chats c ON cp.chat_id = c.id
WHERE c.type = 'group'
ORDER BY cp.last_seen DESC;

-- Summary report
SELECT 
  'Total group chats' as metric,
  COUNT(*) as count
FROM chats 
WHERE type = 'group'
UNION ALL
SELECT 
  'Total group messages' as metric,
  COUNT(*) as count
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE c.type = 'group'
UNION ALL
SELECT 
  'Messages with all participants viewed' as metric,
  COUNT(*) as count
FROM (
  SELECT m.id
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE c.type = 'group'
  AND (
    SELECT COUNT(*) 
    FROM message_views mv 
    WHERE mv.message_id = m.id
  ) = (
    SELECT COUNT(*) 
    FROM chat_participants cp 
    WHERE cp.chat_id = m.chat_id
  )
) fully_viewed; 