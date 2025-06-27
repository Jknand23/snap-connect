-- SnapConnect V2 Row Level Security Policies
-- Run this after the migration to set up proper data access controls

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Sports preferences policies
DROP POLICY IF EXISTS "Users can view own sports preferences" ON public.user_sports_preferences;
DROP POLICY IF EXISTS "Users can update own sports preferences" ON public.user_sports_preferences;

CREATE POLICY "Users can view own sports preferences" ON public.user_sports_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sports preferences" ON public.user_sports_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Stories policies
DROP POLICY IF EXISTS "Users can view stories based on privacy" ON public.stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;

CREATE POLICY "Users can view stories based on privacy" ON public.stories
  FOR SELECT USING (
    user_id = auth.uid() OR
    (privacy_setting = 'public') OR
    (privacy_setting = 'friends' AND EXISTS (
      SELECT 1 FROM public.friendships 
      WHERE (requester_id = auth.uid() AND addressee_id = user_id AND status = 'accepted')
         OR (requester_id = user_id AND addressee_id = auth.uid() AND status = 'accepted')
    ))
  );

CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
DROP POLICY IF EXISTS "Users can view story views" ON public.story_views;
DROP POLICY IF EXISTS "Users can insert story views" ON public.story_views;

CREATE POLICY "Users can view story views" ON public.story_views
  FOR SELECT USING (viewer_id = auth.uid());

CREATE POLICY "Users can insert story views" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Chats policies (Fixed to avoid circular dependency)
DROP POLICY IF EXISTS "Chat participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;

-- Allow users to view chats they created OR are participants in
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

-- Allow users to create chats (no circular dependency)
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to update chats they created
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = created_by);

-- Chat participants policies (Fixed to avoid circular dependency)
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can manage chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can remove themselves from chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can manage participants" ON public.chat_participants;

-- Allow viewing participants if you're the chat creator OR a participant
CREATE POLICY "Users can view chat participants" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.chat_participants cp2
      WHERE cp2.chat_id = chat_participants.chat_id AND cp2.user_id = auth.uid()
    )
  );

-- Allow inserting participants if you're the chat creator OR adding yourself
CREATE POLICY "Users can add chat participants" ON public.chat_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  );

-- Allow users to remove themselves from chats
CREATE POLICY "Users can remove themselves from chats" ON public.chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Allow chat creators to manage all participants
CREATE POLICY "Chat creators can manage participants" ON public.chat_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_participants.chat_id AND created_by = auth.uid()
    )
  );

-- Messages policies
DROP POLICY IF EXISTS "Chat participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to chats they're in" ON public.messages;

CREATE POLICY "Chat participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to chats they're in" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- Message reactions policies
DROP POLICY IF EXISTS "Users can view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can manage own reactions" ON public.message_reactions;

CREATE POLICY "Users can view reactions" ON public.message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own reactions" ON public.message_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Friendships policies
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships they're involved in" ON public.friendships;

CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can create friendship requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're involved in" ON public.friendships
  FOR UPDATE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Posts policies
DROP POLICY IF EXISTS "Users can view posts based on privacy" ON public.posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Users can view posts based on privacy" ON public.posts
  FOR SELECT USING (
    user_id = auth.uid() OR
    (privacy_setting = 'public') OR
    (privacy_setting = 'friends' AND EXISTS (
      SELECT 1 FROM public.friendships 
      WHERE (requester_id = auth.uid() AND addressee_id = user_id AND status = 'accepted')
         OR (requester_id = user_id AND addressee_id = auth.uid() AND status = 'accepted')
    ))
  );

CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Teams table (public read access)
DROP POLICY IF EXISTS "Teams are publicly viewable" ON public.teams;
CREATE POLICY "Teams are publicly viewable" ON public.teams
  FOR SELECT USING (true); 