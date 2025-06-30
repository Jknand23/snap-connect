-- Phase 3B: Multi-Source Integration & Advanced RAG Features
-- ---------------------------------------------------------
-- Adds support for enhanced multi-source content integration,
-- LLM-driven deduplication, and improved personalization.

-- Multi-source content deduplication tracking
CREATE TABLE IF NOT EXISTS public.content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash for deduplication
  source_apis TEXT[] NOT NULL, -- Array of APIs that provided this content
  deduplication_score FLOAT DEFAULT 0.0, -- LLM similarity score (0-1)
  quality_score FLOAT DEFAULT 0.0, -- Content quality rating (0-1)
  primary_source TEXT, -- The "best" source for this content
  merged_content JSONB, -- Combined/merged content from multiple sources
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient hash lookups during deduplication
CREATE INDEX IF NOT EXISTS idx_content_sources_hash 
  ON public.content_sources(content_hash);

-- Index for quality-based queries
CREATE INDEX IF NOT EXISTS idx_content_sources_quality 
  ON public.content_sources(quality_score DESC, created_at DESC);

-- Enhanced user preference tracking for Phase 3B
ALTER TABLE public.user_sports_preferences 
  ADD COLUMN IF NOT EXISTS source_preferences JSONB DEFAULT '{
    "news": true,
    "highlights": true,
    "fan_discussions": true,
    "social_sentiment": false
  }',
  ADD COLUMN IF NOT EXISTS engagement_history JSONB DEFAULT '{
    "clickthrough_rates": {},
    "time_spent_by_source": {},
    "feedback_scores": {}
  }',
  ADD COLUMN IF NOT EXISTS personalization_score FLOAT DEFAULT 0.5;

-- Content interaction tracking (enhanced for Phase 3B)
CREATE TABLE IF NOT EXISTS public.content_interactions_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID, -- Can reference content_embeddings or external content
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'skip', 'save')),
  source_api TEXT NOT NULL, -- Which source API provided this content
  engagement_duration INTEGER DEFAULT 0, -- Time spent in seconds
  context_metadata JSONB DEFAULT '{}', -- Click position, source ranking, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics and personalization
CREATE INDEX IF NOT EXISTS idx_content_interactions_v2_user_source 
  ON public.content_interactions_v2(user_id, source_api, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_interactions_v2_type_duration 
  ON public.content_interactions_v2(interaction_type, engagement_duration DESC);

-- API usage tracking for cost control
CREATE TABLE IF NOT EXISTS public.api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name TEXT NOT NULL, -- 'openai', 'newsapi', 'youtube', 'reddit', etc.
  operation_type TEXT NOT NULL, -- 'embedding', 'completion', 'api_call'
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10,6) DEFAULT 0.00,
  user_id UUID REFERENCES public.profiles(id),
  request_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cost monitoring and budgeting (simplified without functions)
CREATE INDEX IF NOT EXISTS idx_api_usage_daily 
  ON public.api_usage_tracking(api_name, created_at DESC, cost_estimate);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_daily 
  ON public.api_usage_tracking(user_id, created_at DESC, cost_estimate);

-- Content ranking and recommendation system
CREATE TABLE IF NOT EXISTS public.content_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_embedding_id UUID REFERENCES public.content_embeddings(id) ON DELETE CASCADE,
  recommendation_score FLOAT NOT NULL, -- Combined relevance + personalization score
  ranking_factors JSONB DEFAULT '{}', -- What contributed to this score
  source_diversity_bonus FLOAT DEFAULT 0.0, -- Bonus for diverse source mix
  freshness_score FLOAT DEFAULT 0.0, -- Recency weighting
  interaction_predicted JSONB DEFAULT '{}', -- Predicted user engagement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '6 hours'
);

-- Index for efficient recommendation retrieval
CREATE INDEX IF NOT EXISTS idx_content_recommendations_user_score 
  ON public.content_recommendations(user_id, recommendation_score DESC, expires_at);

-- Enable RLS on all new tables
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_interactions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage content sources" ON public.content_sources
  FOR ALL USING (true); -- Service role has full access

CREATE POLICY "Users can view own interactions v2" ON public.content_interactions_v2
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interactions v2" ON public.content_interactions_v2
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage API usage" ON public.api_usage_tracking
  FOR ALL USING (true); -- Service role for monitoring

CREATE POLICY "Users can view own recommendations" ON public.content_recommendations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage recommendations" ON public.content_recommendations
  FOR ALL USING (true); -- Service role for generating recommendations

-- Update content_embeddings to support Phase 3B features
ALTER TABLE public.content_embeddings 
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS deduplication_cluster_id UUID,
  ADD COLUMN IF NOT EXISTS content_quality_score FLOAT DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS engagement_metrics JSONB DEFAULT '{
    "views": 0,
    "likes": 0,
    "shares": 0,
    "avg_time_spent": 0
  }';

-- Index for deduplication queries
CREATE INDEX IF NOT EXISTS idx_content_embeddings_hash 
  ON public.content_embeddings(content_hash) 
  WHERE content_hash IS NOT NULL;

-- Function to calculate content similarity for deduplication
CREATE OR REPLACE FUNCTION public.calculate_content_similarity(
  text1 TEXT,
  text2 TEXT
) RETURNS FLOAT AS $$
BEGIN
  -- Simple text similarity using Levenshtein distance
  -- In production, this would call OpenAI for semantic similarity
  RETURN 1.0 - (levenshtein(text1, text2)::FLOAT / GREATEST(length(text1), length(text2)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user engagement metrics
CREATE OR REPLACE FUNCTION public.update_user_engagement_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_sports_preferences with latest engagement data
  UPDATE public.user_sports_preferences 
  SET engagement_history = engagement_history || jsonb_build_object(
    'last_interaction', NEW.created_at,
    'total_interactions', COALESCE((engagement_history->>'total_interactions')::INTEGER, 0) + 1,
    'source_interactions', engagement_history->'source_interactions' || jsonb_build_object(
      NEW.source_api, COALESCE((engagement_history->'source_interactions'->>NEW.source_api)::INTEGER, 0) + 1
    )
  )
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update engagement metrics
CREATE TRIGGER update_user_engagement_trigger
  AFTER INSERT ON public.content_interactions_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_user_engagement_metrics();

-- Comments for documentation
COMMENT ON TABLE public.content_sources IS 'Phase 3B: Multi-source content deduplication and quality tracking';
COMMENT ON TABLE public.content_interactions_v2 IS 'Phase 3B: Enhanced user interaction tracking with source attribution';
COMMENT ON TABLE public.api_usage_tracking IS 'Phase 3B: API cost monitoring and budget control';
COMMENT ON TABLE public.content_recommendations IS 'Phase 3B: Personalized content ranking and recommendation system';

-- Insert deployment marker
INSERT INTO public.rag_performance_logs (operation_type, metadata) 
VALUES ('migration', jsonb_build_object(
  'phase', '3B', 
  'feature', 'multi_source_integration', 
  'timestamp', NOW()
)); 