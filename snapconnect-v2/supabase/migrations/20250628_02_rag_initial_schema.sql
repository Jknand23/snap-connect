-- Phase 3A: Retrieval-Augmented Generation (RAG) Initial Schema
-- -------------------------------------------------------------
-- Adds pgvector support and minimal tables required for basic
-- personalized news summaries (NewsAPI, BallDontLie, API-Sports).
-- All tables live in the public schema to simplify client queries.

-- Enable vector extension for embeddings (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "vector";

-- -------------------------------------------------------------
-- 1. Raw Content Embeddings
-- Stores canonical sports articles/snippets with their text embeddings.
-- Embedding dimension is fixed to 1536 to match OpenAI text-embedding-3-small.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type      TEXT       NOT NULL CHECK (content_type IN ('news')), -- future-proof
  title             TEXT       NOT NULL,
  content_text      TEXT       NOT NULL,
  embedding         VECTOR(1536), -- pgvector column for similarity search
  metadata          JSONB,
  source_url        TEXT,
  source_api        TEXT,
  teams             TEXT[],
  players           TEXT[],
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at        TIMESTAMP WITH TIME ZONE
);

-- HNSW index for efficient similarity search
CREATE INDEX IF NOT EXISTS idx_content_embeddings_embedding
  ON public.content_embeddings USING hnsw (embedding vector_cosine_ops);

-- -------------------------------------------------------------
-- 2. Per-User RAG Cache
-- Stores AI-generated summaries so we can serve cached responses
-- and control OpenAI costs. Auto-expires after 6 hours.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rag_content_cache (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES public.profiles(id),
  content_type         TEXT DEFAULT 'news-summary',
  ai_generated_content TEXT NOT NULL,
  source_data          JSONB,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at           TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 hours')
);

CREATE INDEX IF NOT EXISTS idx_rag_cache_user_expiry
  ON public.rag_content_cache(user_id, expires_at);

-- -------------------------------------------------------------
-- 3. Personalization Profile (optional for 3A but created now)
-- Captures lightweight user preferences needed for ranking.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_personalization_profiles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES public.profiles(id) UNIQUE,
  favorite_teams       TEXT[] DEFAULT '{}',
  favorite_players     TEXT[] DEFAULT '{}',
  content_preferences  JSONB  DEFAULT '{}',
  interaction_history  JSONB  DEFAULT '{}',
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- Row Level Security
-- Restrict direct table access; clients should use Edge Functions.
-- -------------------------------------------------------------
ALTER TABLE public.content_embeddings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_content_cache           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personalization_profiles ENABLE ROW LEVEL SECURITY;

-- By default, only service-role and the owner can read/write.
CREATE POLICY "deny all content_embeddings" ON public.content_embeddings
  FOR ALL TO public USING (false);
CREATE POLICY "deny all rag_cache" ON public.rag_content_cache
  FOR ALL TO public USING (false);
CREATE POLICY "owner can view personalization" ON public.user_personalization_profiles
  FOR SELECT USING (user_id = auth.uid()); 