-- SnapConnect V2 Stories Permissions and Policies
-- Row Level Security (RLS) policies for stories, story_views, and related tables

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Profiles: Users can read all profiles (for stories feed)
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Profiles: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================================================
-- STORIES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view stories based on privacy" ON public.stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;

-- Stories: Users can view stories based on privacy settings
CREATE POLICY "Users can view stories based on privacy"
ON public.stories
FOR SELECT
USING (
  -- Own stories
  stories.user_id = auth.uid()
  OR
  -- Public stories
  stories.privacy_setting = 'public'
  OR
  -- Friends' stories
  (
    stories.privacy_setting = 'friends'
    AND (
      -- Check if users are friends
      EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE (
          (f.requester_id = auth.uid() AND f.addressee_id = stories.user_id)
          OR
          (f.requester_id = stories.user_id AND f.addressee_id = auth.uid())
        )
        AND f.status = 'accepted'
      )
    )
  )
  OR
  -- Team-based stories (simplified - can be enhanced with team membership)
  (
    stories.privacy_setting = 'teams'
    AND EXISTS (
      SELECT 1 FROM public.user_sports_preferences usp1
      INNER JOIN public.user_sports_preferences usp2 ON (
        usp1.favorite_teams && usp2.favorite_teams
      )
      WHERE usp1.user_id = auth.uid() AND usp2.user_id = stories.user_id
    )
  )
);

-- Stories: Users can insert their own stories
CREATE POLICY "Users can insert own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = stories.user_id);

-- Stories: Users can update their own stories
CREATE POLICY "Users can update own stories"
ON public.stories
FOR UPDATE
USING (auth.uid() = stories.user_id);

-- Stories: Users can delete their own stories
CREATE POLICY "Users can delete own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = stories.user_id);

-- =============================================================================
-- STORY_VIEWS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their story views" ON public.story_views;
DROP POLICY IF EXISTS "Users can insert story views" ON public.story_views;
DROP POLICY IF EXISTS "Users can update own story views" ON public.story_views;

-- Story Views: Users can view story views for their own stories
CREATE POLICY "Users can view their story views"
ON public.story_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_views.story_id
    AND s.user_id = auth.uid()
  )
);

-- Story Views: Users can insert views for stories they can see
CREATE POLICY "Users can insert story views"
ON public.story_views
FOR INSERT
WITH CHECK (
  auth.uid() = story_views.viewer_id
  AND
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_views.story_id
    AND (
      -- Own stories
      s.user_id = auth.uid()
      OR
      -- Public stories
      s.privacy_setting = 'public'
      OR
      -- Friends' stories
      (
        s.privacy_setting = 'friends'
        AND EXISTS (
          SELECT 1 FROM public.friendships f2
          WHERE (
            (f2.requester_id = auth.uid() AND f2.addressee_id = s.user_id)
            OR
            (f2.requester_id = s.user_id AND f2.addressee_id = auth.uid())
          )
          AND f2.status = 'accepted'
        )
      )
      OR
      -- Team-based stories
      (
        s.privacy_setting = 'teams'
        AND EXISTS (
          SELECT 1 FROM public.user_sports_preferences usp1
          INNER JOIN public.user_sports_preferences usp2 ON (
            usp1.favorite_teams && usp2.favorite_teams
          )
          WHERE usp1.user_id = auth.uid() AND usp2.user_id = s.user_id
        )
      )
    )
  )
);

-- Story Views: Users can update their own views (for read receipts)
CREATE POLICY "Users can update own story views"
ON public.story_views
FOR UPDATE
USING (auth.uid() = story_views.viewer_id);

-- =============================================================================
-- USER_SPORTS_PREFERENCES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all sports preferences" ON public.user_sports_preferences;
DROP POLICY IF EXISTS "Users can update own sports preferences" ON public.user_sports_preferences;
DROP POLICY IF EXISTS "Users can insert own sports preferences" ON public.user_sports_preferences;

-- User Sports Preferences: Users can view all preferences (for team-based stories)
CREATE POLICY "Users can view all sports preferences"
ON public.user_sports_preferences
FOR SELECT
USING (true);

-- User Sports Preferences: Users can update their own preferences
CREATE POLICY "Users can update own sports preferences"
ON public.user_sports_preferences
FOR UPDATE
USING (auth.uid() = user_sports_preferences.user_id);

-- User Sports Preferences: Users can insert their own preferences
CREATE POLICY "Users can insert own sports preferences"
ON public.user_sports_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_sports_preferences.user_id);

-- =============================================================================
-- FRIENDSHIPS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;

-- Friendships: Users can view friendships they're part of
CREATE POLICY "Users can view own friendships"
ON public.friendships
FOR SELECT
USING (
  auth.uid() = friendships.requester_id 
  OR 
  auth.uid() = friendships.addressee_id
);

-- Friendships: Users can insert friendship requests
CREATE POLICY "Users can send friend requests"
ON public.friendships
FOR INSERT
WITH CHECK (auth.uid() = friendships.requester_id);

-- Friendships: Users can update friendships they're part of
CREATE POLICY "Users can update own friendships"
ON public.friendships
FOR UPDATE
USING (
  auth.uid() = friendships.requester_id 
  OR 
  auth.uid() = friendships.addressee_id
);

-- Friendships: Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships"
ON public.friendships
FOR DELETE
USING (
  auth.uid() = friendships.requester_id 
  OR 
  auth.uid() = friendships.addressee_id
);

-- =============================================================================
-- TEAMS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all teams" ON public.teams;

-- Teams: All users can view teams (public reference data)
CREATE POLICY "Users can view all teams"
ON public.teams
FOR SELECT
USING (true);

-- =============================================================================
-- ADDITIONAL FUNCTIONS FOR STORY MANAGEMENT
-- =============================================================================

-- Drop existing functions if they exist
DO $$
DECLARE
    func_exists boolean;
BEGIN
    -- Check and drop increment_story_view_count
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'increment_story_view_count'
    ) INTO func_exists;
    
    IF func_exists THEN
        DROP FUNCTION public.increment_story_view_count(UUID);
    END IF;
    
    -- Check and drop increment_story_views
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'increment_story_views'
    ) INTO func_exists;
    
    IF func_exists THEN
        DROP FUNCTION public.increment_story_views(UUID);
    END IF;
    
    -- Check and drop cleanup_expired_stories
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_stories'
    ) INTO func_exists;
    
    IF func_exists THEN
        DROP FUNCTION public.cleanup_expired_stories();
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, continue anyway
    NULL;
END $$;

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_view_count(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stories 
  SET view_count = view_count + 1 
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired stories (runs on schedule)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired stories
  DELETE FROM public.stories 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC STORY VIEW COUNTING
-- =============================================================================

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS on_story_view_insert ON public.story_views;
DROP FUNCTION IF EXISTS trigger_increment_story_views();

-- Trigger to automatically increment view count when a story view is inserted
CREATE OR REPLACE FUNCTION trigger_increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if this is a new view (not an update)
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories 
    SET view_count = view_count + 1 
    WHERE id = NEW.story_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_story_view_insert
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_story_views();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for story queries
CREATE INDEX IF NOT EXISTS idx_stories_user_expires ON public.stories(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_privacy_expires ON public.stories(privacy_setting, expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- Indexes for story views
CREATE INDEX IF NOT EXISTS idx_story_views_story_viewer ON public.story_views(story_id, viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_viewed ON public.story_views(viewer_id, viewed_at DESC);

-- Indexes for friendships
CREATE INDEX IF NOT EXISTS idx_friendships_requester_status ON public.friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_status ON public.friendships(addressee_id, status);

-- Indexes for sports preferences
CREATE INDEX IF NOT EXISTS idx_user_sports_preferences_teams ON public.user_sports_preferences USING GIN(favorite_teams);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION increment_story_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_stories() TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Enable realtime for stories (for live story updates)
-- Note: These may show warnings if tables are already in the publication
DO $$
BEGIN
  -- Add tables to realtime publication if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
END $$;

-- =============================================================================
-- VALIDATION FUNCTIONS
-- =============================================================================

-- Drop existing validation triggers and functions if they exist
DROP TRIGGER IF EXISTS validate_story_privacy_trigger ON public.stories;
DROP FUNCTION IF EXISTS validate_story_privacy();

-- Function to validate story privacy settings
CREATE OR REPLACE FUNCTION validate_story_privacy()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate privacy setting
  IF NEW.privacy_setting NOT IN ('public', 'friends', 'teams') THEN
    RAISE EXCEPTION 'Invalid privacy setting: %', NEW.privacy_setting;
  END IF;
  
  -- Validate team filter for team privacy
  IF NEW.privacy_setting = 'teams' AND (NEW.team_filter IS NULL OR array_length(NEW.team_filter, 1) = 0) THEN
    RAISE EXCEPTION 'Team filter is required for team privacy setting';
  END IF;
  
  -- Validate expiration date
  IF NEW.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Story expiration date must be in the future';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger for stories
CREATE TRIGGER validate_story_privacy_trigger
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION validate_story_privacy();

-- =============================================================================
-- SCHEDULED CLEANUP (if using pg_cron extension)
-- =============================================================================

-- Schedule cleanup of expired stories (runs every hour)
-- Uncomment if pg_cron extension is available:
-- SELECT cron.schedule('cleanup-expired-stories', '0 * * * *', 'SELECT cleanup_expired_stories();');

-- =============================================================================
-- ANALYTICS VIEWS (OPTIONAL)
-- =============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS story_analytics;

-- View for story analytics
CREATE VIEW story_analytics AS
SELECT 
  s.id,
  s.user_id,
  s.created_at,
  s.expires_at,
  s.privacy_setting,
  s.view_count,
  COUNT(sv.id) as unique_views,
  p.username
FROM public.stories s
LEFT JOIN public.story_views sv ON s.id = sv.story_id
LEFT JOIN public.profiles p ON s.user_id = p.id
WHERE s.user_id = auth.uid()  -- Only show analytics for own stories
GROUP BY s.id, s.user_id, s.created_at, s.expires_at, s.privacy_setting, s.view_count, p.username;

-- Grant select permission on analytics view
GRANT SELECT ON story_analytics TO authenticated; 