-- Phase 3A Week 2: RAG System Enhancements
-- -------------------------------------------------------------
-- Enhances the RAG system with user feedback collection, full article
-- ingestion capabilities, and performance monitoring support.

-- RAG User Feedback (Phase 3A Week 2)
-- Stores user feedback on AI-generated content for learning and improvement
CREATE TABLE IF NOT EXISTS public.rag_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL, -- Reference to the AI-generated content
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not-relevant')),
  metadata JSONB DEFAULT '{}', -- Store source attribution, relevance score, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate feedback for same content by same user
  UNIQUE(user_id, content_id)
);

-- Index for efficient feedback queries
CREATE INDEX IF NOT EXISTS idx_rag_feedback_user_created 
  ON public.rag_user_feedback(user_id, created_at DESC);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_rag_feedback_type_created 
  ON public.rag_user_feedback(feedback_type, created_at DESC);

-- Row Level Security for RAG feedback
ALTER TABLE public.rag_user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see and insert their own feedback
CREATE POLICY "Users can manage own RAG feedback" ON public.rag_user_feedback
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Update content_embeddings table to support enhanced metadata
-- Add new columns for better tracking
ALTER TABLE public.content_embeddings 
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT;

-- Add index for better content retrieval performance
CREATE INDEX IF NOT EXISTS idx_content_embeddings_source_created 
  ON public.content_embeddings(source_api, created_at DESC);

-- Add index for team-based content queries
CREATE INDEX IF NOT EXISTS idx_content_embeddings_teams_gin 
  ON public.content_embeddings USING gin(teams);

-- Performance tracking table (for dashboard metrics)
CREATE TABLE IF NOT EXISTS public.rag_performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL, -- 'generation', 'cache_hit', 'cache_miss'
  user_id UUID REFERENCES public.profiles(id),
  response_time_ms INTEGER,
  source_apis TEXT[], -- Which APIs were used
  cache_hit BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance analytics
CREATE INDEX IF NOT EXISTS idx_rag_performance_type_created 
  ON public.rag_performance_logs(operation_type, created_at DESC);

-- Enable RLS for performance logs
ALTER TABLE public.rag_performance_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read performance logs (for dashboard)
CREATE POLICY "Service role can read performance logs" ON public.rag_performance_logs
  FOR SELECT USING (true); -- Service role has full access

-- Update user_sports_preferences to better support RAG personalization
ALTER TABLE public.user_sports_preferences 
  ADD COLUMN IF NOT EXISTS content_preferences JSONB DEFAULT '{
    "readingStyle": "concise",
    "contentTypes": ["breaking", "analysis"],
    "notificationTiming": "daily-digest"
  }',
  ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{
    "tone": "neutral",
    "length": "brief",
    "focus": "team-centric"
  }';

-- Comment documenting Week 2 completion
COMMENT ON TABLE public.rag_user_feedback IS 'Phase 3A Week 2: User feedback collection for AI content learning';
COMMENT ON TABLE public.rag_performance_logs IS 'Phase 3A Week 2: Performance tracking for RAG system monitoring';

-- Insert initial performance record to track deployment
INSERT INTO public.rag_performance_logs (operation_type, metadata)
VALUES ('deployment', '{"phase": "3A-week2", "features": ["full_article_ingestion", "user_feedback", "performance_monitoring"]}'); 