-- Phase 3C: Full Showcase Features - Clean Migration
-- ---------------------------------------------------
-- Adds Phase 3C specific features only, avoiding conflicts with existing tables

-- Real-time live game events tracking
CREATE TABLE IF NOT EXISTS public.live_game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('score', 'turnover', 'big_play', 'injury', 'goal', 'touchdown', 'home_run')),
  event_description TEXT NOT NULL,
  teams_involved TEXT[] NOT NULL,
  players_involved TEXT[] DEFAULT '{}',
  quarter_period TEXT,
  game_time TEXT,
  significance_score FLOAT DEFAULT 0.5,
  processed_for_users UUID[] DEFAULT '{}',
  highlight_generated BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_api TEXT DEFAULT 'live_tracker'
);

-- Enhanced video content tracking
CREATE TABLE IF NOT EXISTS public.video_content_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_embedding_id UUID,
  video_url TEXT NOT NULL,
  video_platform TEXT NOT NULL CHECK (video_platform IN ('youtube', 'espn', 'nfl', 'nba', 'mlb', 'nhl')),
  video_duration_seconds INTEGER,
  video_quality TEXT,
  thumbnail_url TEXT,
  video_type TEXT CHECK (video_type IN ('highlight', 'interview', 'analysis', 'full_game', 'recap')),
  engagement_metrics JSONB DEFAULT '{"views": 0, "likes": 0, "comments": 0, "shares": 0}',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time game subscriptions
CREATE TABLE IF NOT EXISTS public.user_game_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  game_id TEXT NOT NULL,
  team_supporting TEXT,
  notification_preferences JSONB DEFAULT '{"score_updates": true, "big_plays": true, "injuries": false, "quarter_end": false}',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_update_sent TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, game_id)
);

-- Advanced API performance tracking
CREATE TABLE IF NOT EXISTS public.api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name TEXT NOT NULL,
  endpoint TEXT,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER,
  success BOOLEAN DEFAULT TRUE,
  request_size_bytes INTEGER DEFAULT 0,
  response_size_bytes INTEGER DEFAULT 0,
  rate_limit_remaining INTEGER,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional Pinecone configuration
CREATE TABLE IF NOT EXISTS public.pinecone_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT FALSE,
  api_key_encrypted TEXT,
  index_name TEXT DEFAULT 'snapconnect-sports',
  environment TEXT DEFAULT 'us-east-1-aws',
  dimension INTEGER DEFAULT 1536,
  metric TEXT DEFAULT 'cosine',
  migration_status TEXT DEFAULT 'not_started' CHECK (migration_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  performance_comparison JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live game highlight generation queue
CREATE TABLE IF NOT EXISTS public.highlight_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_event_id UUID,
  user_id UUID,
  priority INTEGER DEFAULT 5,
  processing_status TEXT DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed')),
  generated_content TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_events_game_time 
  ON public.live_game_events(game_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_live_events_unprocessed 
  ON public.live_game_events(processed_for_users, highlight_generated, timestamp DESC) 
  WHERE highlight_generated = FALSE;

CREATE INDEX IF NOT EXISTS idx_api_performance_name_time 
  ON public.api_performance_metrics(api_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_api_performance_success 
  ON public.api_performance_metrics(success, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_highlight_queue_priority 
  ON public.highlight_generation_queue(priority DESC, created_at ASC)
  WHERE processing_status = 'queued';

-- Enable RLS on new tables
ALTER TABLE public.live_game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_content_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinecone_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage live game events" ON public.live_game_events
  FOR ALL USING (true);

CREATE POLICY "Service role can manage video metadata" ON public.video_content_metadata
  FOR ALL USING (true);

CREATE POLICY "Users can manage own game subscriptions" ON public.user_game_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role can manage API performance" ON public.api_performance_metrics
  FOR ALL USING (true);

CREATE POLICY "Service role can manage Pinecone config" ON public.pinecone_config
  FOR ALL USING (true);

CREATE POLICY "Users can view own highlight queue" ON public.highlight_generation_queue
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage highlight queue" ON public.highlight_generation_queue
  FOR ALL USING (true);

-- Function to calculate showcase readiness
CREATE OR REPLACE FUNCTION public.calculate_showcase_readiness()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  source_count INTEGER;
  dedup_rate FLOAT;
  response_time FLOAT;
  user_satisfaction FLOAT;
BEGIN
  -- Count active data sources
  SELECT COUNT(DISTINCT source_api) INTO source_count
  FROM public.content_embeddings
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND source_api IS NOT NULL;
  
  -- Calculate deduplication effectiveness
  SELECT COALESCE(AVG(deduplication_score), 0.0) INTO dedup_rate
  FROM public.content_sources
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- Calculate average response time
  SELECT COALESCE(AVG(response_time_ms), 0.0) INTO response_time
  FROM public.rag_performance_logs
  WHERE operation_type = 'generation'
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  -- Calculate user satisfaction from feedback
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.5
      ELSE COUNT(CASE WHEN feedback_type = 'helpful' THEN 1 END)::FLOAT / COUNT(*)
    END INTO user_satisfaction
  FROM public.rag_user_feedback
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  result := jsonb_build_object(
    'data_sources_active', COALESCE(source_count, 0),
    'deduplication_rate', COALESCE(dedup_rate, 0.0),
    'avg_response_time_ms', COALESCE(response_time, 0.0),
    'user_satisfaction_rate', COALESCE(user_satisfaction, 0.5),
    'showcase_ready', (
      COALESCE(source_count, 0) >= 6 AND
      COALESCE(dedup_rate, 0.0) >= 0.85 AND
      COALESCE(response_time, 10000.0) < 5000 AND
      COALESCE(user_satisfaction, 0.0) >= 0.7
    ),
    'phase', '3C',
    'last_calculated', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add Phase 3C enhancements to existing content_recommendations if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_recommendations') THEN
    -- Add Phase 3C columns to content_recommendations
    ALTER TABLE public.content_recommendations 
      ADD COLUMN IF NOT EXISTS video_content_score FLOAT DEFAULT 0.0,
      ADD COLUMN IF NOT EXISTS real_time_bonus FLOAT DEFAULT 0.0,
      ADD COLUMN IF NOT EXISTS viral_potential_score FLOAT DEFAULT 0.0,
      ADD COLUMN IF NOT EXISTS cross_platform_reach INTEGER DEFAULT 0;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE public.live_game_events IS 'Phase 3C: Real-time live game event tracking for instant highlights';
COMMENT ON TABLE public.video_content_metadata IS 'Phase 3C: Enhanced video content metadata and engagement tracking';
COMMENT ON TABLE public.user_game_subscriptions IS 'Phase 3C: Real-time game subscription management';
COMMENT ON TABLE public.pinecone_config IS 'Phase 3C: Optional Pinecone vector database configuration';
COMMENT ON TABLE public.highlight_generation_queue IS 'Phase 3C: Live game highlight generation queue processing';

-- Insert Phase 3C deployment marker
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rag_performance_logs') THEN
    INSERT INTO public.rag_performance_logs (operation_type, metadata) 
    VALUES ('migration', jsonb_build_object(
      'phase', '3C', 
      'feature', 'full_showcase_features', 
      'timestamp', NOW(),
      'new_tables', 6,
      'real_time_features', true,
      'pinecone_support', true
    ));
  END IF;
END $$; 