-- Communities Migration
-- Adds community support with team-specific and league-wide communities
-- Messages in communities expire after 1 hour automatically

-- Communities table
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('team', 'league')) NOT NULL,
  team_id UUID REFERENCES public.teams(id), -- null for league communities
  league TEXT CHECK (league IN ('NFL', 'NBA', 'MLB', 'NHL')), -- for both team and league communities
  emoji TEXT DEFAULT '🏟️',
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community memberships
CREATE TABLE public.community_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Community messages (separate from regular chat messages)
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('text', 'photo', 'video', 'story_share')),
  reply_to UUID REFERENCES public.community_messages(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'), -- Auto-expire after 1 hour
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community message reactions
CREATE TABLE public.community_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for performance
CREATE INDEX idx_communities_type ON public.communities(type);
CREATE INDEX idx_communities_league ON public.communities(league);
CREATE INDEX idx_communities_team_id ON public.communities(team_id);
CREATE INDEX idx_community_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX idx_community_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX idx_community_messages_community_id ON public.community_messages(community_id);
CREATE INDEX idx_community_messages_expires_at ON public.community_messages(expires_at);
CREATE INDEX idx_community_messages_created_at ON public.community_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Users can view communities they're eligible for" ON public.communities
FOR SELECT USING (
  CASE 
    WHEN type = 'league' THEN 
      -- League communities: user must have at least one team from that league
      EXISTS (
        SELECT 1 FROM public.user_sports_preferences usp
        WHERE usp.user_id = auth.uid()
        AND usp.preferred_leagues @> ARRAY[league]
      )
    WHEN type = 'team' THEN
      -- Team communities: user must have this specific team in favorites
      EXISTS (
        SELECT 1 FROM public.user_sports_preferences usp
        WHERE usp.user_id = auth.uid()
        AND usp.favorite_teams @> ARRAY[team_id::text]
      )
    ELSE false
  END
);

-- RLS Policies for community memberships
CREATE POLICY "Users can view memberships for communities they can access" ON public.community_memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id
    AND (
      CASE 
        WHEN c.type = 'league' THEN 
          EXISTS (
            SELECT 1 FROM public.user_sports_preferences usp
            WHERE usp.user_id = auth.uid()
            AND usp.preferred_leagues @> ARRAY[c.league]
          )
        WHEN c.type = 'team' THEN
          EXISTS (
            SELECT 1 FROM public.user_sports_preferences usp
            WHERE usp.user_id = auth.uid()
            AND usp.favorite_teams @> ARRAY[c.team_id::text]
          )
        ELSE false
      END
    )
  )
);

CREATE POLICY "Users can manage their own memberships" ON public.community_memberships
FOR ALL USING (user_id = auth.uid());

-- RLS Policies for community messages
CREATE POLICY "Users can view messages in communities they're members of" ON public.community_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_messages.community_id
    AND cm.user_id = auth.uid()
  )
  AND expires_at > NOW() -- Only show non-expired messages
);

CREATE POLICY "Users can send messages to communities they're members of" ON public.community_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_messages.community_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their own messages" ON public.community_messages
FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.community_messages
FOR DELETE USING (sender_id = auth.uid());

-- RLS Policies for community message reactions
CREATE POLICY "Users can view reactions in communities they're members of" ON public.community_message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_messages cm
    JOIN public.community_memberships cmb ON cmb.community_id = cm.community_id
    WHERE cm.id = message_id
    AND cmb.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own reactions" ON public.community_message_reactions
FOR ALL USING (user_id = auth.uid());

-- Function to auto-create communities for teams
CREATE OR REPLACE FUNCTION create_team_community(team_record public.teams)
RETURNS UUID AS $$
DECLARE
  community_id UUID;
BEGIN
  INSERT INTO public.communities (name, type, team_id, league, emoji)
  VALUES (
    team_record.name,
    'team',
    team_record.id,
    team_record.league,
    CASE team_record.league
      WHEN 'NFL' THEN '🏈'
      WHEN 'NBA' THEN '🏀'
      WHEN 'MLB' THEN '⚾'
      WHEN 'NHL' THEN '🏒'
      ELSE '🏟️'
    END
  )
  RETURNING id INTO community_id;
  
  RETURN community_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create league communities
CREATE OR REPLACE FUNCTION create_league_communities()
RETURNS void AS $$
BEGIN
  -- Create league-wide communities
  INSERT INTO public.communities (name, type, league, emoji)
  VALUES 
    ('NFL Discussion', 'league', 'NFL', '🏈'),
    ('NBA Discussion', 'league', 'NBA', '🏀'),
    ('MLB Discussion', 'league', 'MLB', '⚾'),
    ('NHL Discussion', 'league', 'NHL', '🏒')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired community messages
CREATE OR REPLACE FUNCTION cleanup_expired_community_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.community_messages
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-join user to eligible communities
CREATE OR REPLACE FUNCTION auto_join_user_communities(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Join team communities for user's favorite teams
  INSERT INTO public.community_memberships (community_id, user_id)
  SELECT c.id, user_id
  FROM public.communities c
  JOIN public.user_sports_preferences usp ON usp.user_id = auto_join_user_communities.user_id
  WHERE c.type = 'team'
  AND usp.favorite_teams @> ARRAY[c.team_id::text]
  ON CONFLICT (community_id, user_id) DO NOTHING;
  
  -- Join league communities for user's preferred leagues
  INSERT INTO public.community_memberships (community_id, user_id)
  SELECT c.id, user_id
  FROM public.communities c
  JOIN public.user_sports_preferences usp ON usp.user_id = auto_join_user_communities.user_id
  WHERE c.type = 'league'
  AND usp.preferred_leagues @> ARRAY[c.league]
  ON CONFLICT (community_id, user_id) DO NOTHING;
  
  -- Update member counts
  UPDATE public.communities
  SET member_count = (
    SELECT COUNT(*)
    FROM public.community_memberships
    WHERE community_id = communities.id
  );
END;
$$ LANGUAGE plpgsql;

-- Create league communities on migration
SELECT create_league_communities();

-- Create team communities for existing teams
INSERT INTO public.communities (name, type, team_id, league, emoji)
SELECT 
  t.name,
  'team',
  t.id,
  t.league,
  CASE t.league
    WHEN 'NFL' THEN '🏈'
    WHEN 'NBA' THEN '🏀'
    WHEN 'MLB' THEN '⚾'
    WHEN 'NHL' THEN '🏒'
    ELSE '🏟️'
  END
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.communities c
  WHERE c.team_id = t.id AND c.type = 'team'
); 