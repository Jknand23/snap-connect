-- Fix RAG Performance Logs Schema - Missing Columns
-- Adds the missing columns that the RAG service expects

-- Add missing columns to rag_performance_logs table
ALTER TABLE public.rag_performance_logs 
  ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS error_type TEXT,
  ADD COLUMN IF NOT EXISTS sources_used TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS features_used TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to populate timestamp field
UPDATE public.rag_performance_logs 
SET timestamp = created_at 
WHERE timestamp IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_performance_success_time 
  ON public.rag_performance_logs(success, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_rag_performance_error_type 
  ON public.rag_performance_logs(error_type, timestamp DESC) 
  WHERE error_type IS NOT NULL;

-- Update RLS policies for service role access
DROP POLICY IF EXISTS "Service role can read performance logs" ON public.rag_performance_logs;
CREATE POLICY "Service role full access to performance logs" ON public.rag_performance_logs
  FOR ALL USING (true);

-- Insert a test record to verify the fix
INSERT INTO public.rag_performance_logs 
  (operation_type, success, error_type, sources_used, features_used, metadata)
VALUES 
  ('schema_fix_test', true, null, ARRAY['newsapi', 'balldontlie'], ARRAY['five_sources'], 
   jsonb_build_object('test', true, 'fixed_at', NOW()));

COMMENT ON TABLE public.rag_performance_logs IS 'Schema updated to match RAG service expectations - 2025-06-28';

-- Phase 3C: Final RAG Performance & Freshness Enhancements
-- ---------------------------------------------------------
-- Fixes performance logging and adds enhanced fresh content search

-- Enable vector extension for embeddings (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enhanced vector search function with date filtering for fresh content
CREATE OR REPLACE FUNCTION search_content_fresh(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.5,
  match_count int DEFAULT 7,
  date_cutoff timestamptz DEFAULT NOW() - INTERVAL '14 days'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_text TEXT,
  source_url TEXT,
  source_api TEXT,
  content_type TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ce.id,
    ce.title,
    ce.content_text,
    ce.source_url,
    ce.source_api,
    ce.content_type,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM content_embeddings ce
  WHERE 
    -- Date filtering: only content from specified cutoff date
    (ce.created_at >= date_cutoff OR 
     (ce.metadata->>'published_at')::timestamptz >= date_cutoff)
    AND 1 - (ce.embedding <=> query_embedding) > similarity_threshold
  ORDER BY 
    -- Prioritize by similarity first, then by recency
    similarity DESC,
    ce.created_at DESC
  LIMIT match_count;
$$;

-- Add index for better performance on created_at queries
CREATE INDEX IF NOT EXISTS idx_content_embeddings_created_at_desc 
  ON public.content_embeddings(created_at DESC);

-- Add index for metadata published_at queries  
CREATE INDEX IF NOT EXISTS idx_content_embeddings_metadata_published_at 
  ON public.content_embeddings USING gin((metadata->>'published_at'));

-- Update existing search_content function to include created_at in results
CREATE OR REPLACE FUNCTION search_content(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.5,
  match_count int DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_text TEXT,
  source_url TEXT,
  source_api TEXT,
  content_type TEXT,
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ce.id,
    ce.title,
    ce.content_text,
    ce.source_url,
    ce.source_api,
    ce.content_type,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity,
    ce.created_at
  FROM content_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Performance monitoring enhancement
ALTER TABLE public.rag_performance_logs 
  ADD COLUMN IF NOT EXISTS content_freshness_score FLOAT DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS date_filtering_applied BOOLEAN DEFAULT FALSE;

-- Add comment documenting the enhancement
COMMENT ON FUNCTION search_content_fresh IS 'Enhanced vector search with date filtering for fresh content retrieval (last 2 weeks default)';
COMMENT ON INDEX idx_content_embeddings_created_at_desc IS 'Performance index for fresh content queries';
COMMENT ON INDEX idx_content_embeddings_metadata_published_at IS 'Performance index for published_at metadata queries'; 