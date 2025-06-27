-- SnapConnect V2 - Step-by-Step Setup Script
-- Run each section separately in your Supabase Dashboard SQL Editor

-- ============================================
-- STEP 1: CREATE MESSAGE_VIEWS TABLE
-- ============================================
-- Run this first:

CREATE TABLE public.message_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE public.message_views ADD CONSTRAINT message_views_message_viewer_unique UNIQUE (message_id, viewer_id);

-- ============================================
-- STEP 2: CREATE CHAT_PRESENCE TABLE
-- ============================================
-- Run this second:

CREATE TABLE public.chat_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE public.chat_presence ADD CONSTRAINT chat_presence_chat_user_unique UNIQUE (chat_id, user_id);

-- ============================================
-- STEP 3: ADD COLUMNS TO MESSAGES TABLE
-- ============================================
-- Run this third:

ALTER TABLE public.messages ADD COLUMN is_disappearing BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN should_disappear BOOLEAN DEFAULT FALSE;

-- ============================================
-- STEP 4: CREATE INDEXES
-- ============================================
-- Run this fourth:

CREATE INDEX idx_message_views_message_id ON public.message_views(message_id);
CREATE INDEX idx_message_views_viewer_id ON public.message_views(viewer_id);
CREATE INDEX idx_chat_presence_chat_id ON public.chat_presence(chat_id);
CREATE INDEX idx_chat_presence_user_id ON public.chat_presence(user_id);
CREATE INDEX idx_chat_presence_active ON public.chat_presence(is_active);
CREATE INDEX idx_messages_disappearing ON public.messages(is_disappearing, should_disappear);

-- ============================================
-- STEP 5: ENABLE RLS AND CREATE POLICIES
-- ============================================
-- Run this fifth:

-- Enable RLS
ALTER TABLE public.message_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_views
CREATE POLICY "Users can view message views for their chats" ON public.message_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      JOIN public.messages m ON message_views.message_id = m.id
      WHERE cp.chat_id = m.chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own message views" ON public.message_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- RLS policies for chat_presence
CREATE POLICY "Users can view presence for their chats" ON public.chat_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_presence.chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own presence" ON public.chat_presence
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- STEP 6: TEST THE SETUP
-- ============================================
-- Run this sixth to verify everything works:

-- Test that tables exist
SELECT 'message_views' as table_name, COUNT(*) as row_count FROM public.message_views
UNION ALL
SELECT 'chat_presence' as table_name, COUNT(*) as row_count FROM public.chat_presence;

-- Test that functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('mark_group_message_viewed', 'force_cleanup_all_group_messages')
ORDER BY routine_name;

-- ============================================
-- STEP 7: CLEANUP (OPTIONAL)
-- ============================================
-- Only run this if you want to clean up existing data:

-- Mark all existing messages as viewed by all participants
INSERT INTO public.message_views (message_id, viewer_id, viewed_at)
SELECT DISTINCT m.id, cp.user_id, NOW()
FROM public.messages m
JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.message_views mv 
  WHERE mv.message_id = m.id AND mv.viewer_id = cp.user_id
)
ON CONFLICT (message_id, viewer_id) DO NOTHING;

-- Set all users as inactive in chat presence
INSERT INTO public.chat_presence (chat_id, user_id, is_active, last_seen)
SELECT DISTINCT cp.chat_id, cp.user_id, FALSE, NOW()
FROM public.chat_participants cp
ON CONFLICT (chat_id, user_id) DO UPDATE SET
  is_active = FALSE,
  last_seen = NOW();

-- Test cleanup function
SELECT force_cleanup_all_group_messages() as messages_cleaned;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
-- Run this last to see the final status:

SELECT 
  'Setup Complete!' as status,
  'Group messaging with ephemeral messages is now ready' as message; 