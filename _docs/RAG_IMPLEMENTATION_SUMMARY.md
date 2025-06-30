# RAG Discovery Feed - Implementation Summary

## Overview
This document outlines the implementation of a Retrieval-Augmented Generation (RAG) system for personalized sports content in SnapConnect V2.

### Key Features
- **Multi-API Approach**: NewsAPI, API-SPORTS, BallDontLie, YouTube API, Reddit RSS
- **Vector Database**: Supabase pgvector for similarity search
- **AI Generation**: OpenAI GPT-4 for content summarization
- **Real-time Updates**: Live sports data integration
- **Personalization**: User preference-based content ranking

## 🎯 **Key Decisions Made**

### **Data Sources (Finalized)**
- **NewsAPI**: Primary news source (500 requests/day free)
- **API-SPORTS**: Detailed statistics and fixtures
- **BallDontLie**: NBA-specific data (free, unlimited)
- **YouTube API**: Video highlights (10k requests/day free)
- **Reddit RSS**: Fan sentiment and discussions (unlimited)

### **Implementation Approach**
- **Phase 3A**: NewsAPI + BallDontLie foundation with basic summaries
- **Phase 3B**: Add API-Sports + YouTube integration
- **Phase 3C**: Full multi-source with Reddit sentiment analysis

## 🔧 **Technical Implementation**

### **Phase 3A: Foundation (Weeks 1-2)**
**Goal**: Prove RAG concept with controlled cost and complexity

**Data Sources**:
- NewsAPI for sports headlines and descriptions
- BallDontLie for NBA scores and game data
- API-Sports for basic status/fixture information

**Architecture**:
```typescript
// Multi-source content fetching
const [newsApiData, ballDontLieData, apiSportsData] = await Promise.all([
  fetchNewsAPI(userTeams),
  fetchBallDontLie(userTeams), 
  fetchApiSports(),
]);

const allContent = [...newsApiData, ...ballDontLieData, ...apiSportsData];
```

**Success Criteria**:
- ✅ Cost per user under $0.05/day
- ✅ Response time under 5 seconds
- ✅ User satisfaction >70% (feedback system implemented)
- ✅ 95%+ API uptime

**Phase 3A Status**: ✅ **COMPLETED (June 28, 2025)** - All Week 2 enhancements delivered

### **Phase 3B: Enhanced Integration (Weeks 3-4)**
**Goal**: Rich multi-source content with deduplication

**Additional Sources**:
- YouTube API for official highlights
- Enhanced API-Sports integration for detailed fixtures

**Advanced Features**:
- Cross-source content deduplication
- Quality scoring and ranking
- User interaction learning

### **Environment Setup**

```bash
# Required API Keys
NEWSAPI_API_KEY=...                # Primary news source
API_SPORTS_API_KEY=...             # Sports statistics
YOUTUBE_API_KEY=...                # Video highlights (Phase 3B+)

# OpenAI & Supabase
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### **Cost Analysis**

**Free Tier Limits**:
- NewsAPI: 500 requests/day (sufficient for MVP)
- BallDontLie: Unlimited (free)
- API-Sports: 100 requests/day (basic tier)
- YouTube API: 10k requests/day

**Estimated Monthly Costs**:
- Phase 3A: ~$25/month (OpenAI embeddings + GPT-4o-mini)
- Phase 3B: ~$60/month (upgraded GPT-4o + more sources)
- Phase 3C: ~$180/month (full feature set)

## 📋 **What You Need to Implement**

### **Phase 1: Multi-Source Foundation (Week 1)**
```typescript
// 1. Comprehensive API Integration Service
- Set up NewsAPI for sports headlines and BallDontLie for NBA data
- Set up NewsAPI for sports headlines
- Set up API-SPORTS for detailed statistics
- Set up BallDontLie for NBA data (unlimited free)
- Set up YouTube API for official highlights
- Set up Reddit RSS for fan discussions
- Build parallel fetching with Promise.allSettled for resilience

// 2. LLM-Driven Content Curation
- Implement GPT-4o content deduplication across all sources
- Create intelligent content ranking algorithms
- Build cross-source validation logic
- Add content quality scoring

// 3. Pinecone Vector Database Setup
- Set up Pinecone free tier (100k vectors)
- Create embedding pipeline with text-embedding-3-small
- Build vector storage and retrieval system
- Implement advanced similarity search
```

### **Phase 2: Discovery Integration (Week 2)**
```typescript
// 4. Discovery Screen Enhancement
- Replace mock "For You" content with RAG-generated summaries
- Add AI content badges and special rendering
- Implement user feedback collection (helpful/not relevant)
- Create fallback mechanisms for API failures

// 5. Caching & Performance
- Implement 6-hour content cache
- Add performance monitoring (sub-3 second target)
- Create cost tracking and daily limits
- Build health check endpoints
```

### **Phase 3: Real-time Features (Week 3)**
```typescript
// 6. Live Game Processing
- Set up NewsAPI + BallDontLie polling (30 seconds during live games)
- Create game event detection (scores, big plays, turnovers)
- Build personalized highlight generation
- Implement push notification system

// 7. Advanced Personalization  
- Add content relevance scoring
- Create A/B testing framework
- Implement user feedback learning
- Build trending topic detection
```

## 🔧 **Required Setup**

### **Environment Variables**
```bash
# Add to your .env for showcase setup
OPENAI_API_KEY=sk-...           # Required for embeddings + GPT-4o chat
PINECONE_API_KEY=...            # Required for vector database (free tier)
PINECONE_ENVIRONMENT=...        # Pinecone environment (e.g., us-west1-gcp-free)

# API Keys for all data sources
NEWSAPI_KEY=...                 # Free tier: 500 requests/day
NEWSAPI_API_KEY=...             # Required for sports headlines
API_SPORTS_API_KEY=...          # Optional for enhanced stats
API_SPORTS_KEY=...              # Free tier: 100 requests/day
YOUTUBE_API_KEY=...             # Free tier: 10,000 requests/day
# BallDontLie: No API key needed (unlimited free)
# Reddit RSS: No API key needed (public feeds)

# Supabase (already configured)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

### **Database Migration**
```sql
-- New tables needed (run these migrations)
1. sports_content (with pgvector embedding column)
2. user_personalization_profiles  
3. rag_generated_content (for caching)
4. live_game_events (for real-time processing)
```

### **Dependencies**
```json
{
  "openai": "^4.20.0",           // For embeddings + GPT-4o chat
  "pinecone": "^3.0.0",          // For vector database operations
  "node-cron": "^3.0.3",        // For scheduled content ingestion
  "axios": "^1.6.0",            // For API calls to multiple sources
  "rss-parser": "^3.13.0"       // For Reddit RSS feeds
}
```

## 💰 **Showcase Cost Breakdown**

### **Free Tier Limits** (Perfect for showcase)
- **Pinecone**: 100k vectors free (sufficient for content embedding)
- **OpenAI**: Pay-per-use (estimate ~$30-50/month for showcase usage)
- **NewsAPI**: 500 requests/day free
- **API-SPORTS**: 100 requests/day free  
- **YouTube API**: 10,000 requests/day free
- **BallDontLie**: Unlimited free
- **Reddit RSS**: Unlimited free
- **NewsAPI**: 500 requests/day free
- **BallDontLie**: Unlimited free NBA data

### **Showcase Usage Strategy**
- Focus on quality over quantity (perfect for demo)
- Free tiers provide sufficient data for compelling showcase
- Smart rate limiting to stay within free quotas
- Demonstrate value with limited but high-quality content generation

## 📊 **Success Metrics**

### **Performance Targets**
- Content generation: < 3 seconds
- Vector search: < 500ms  
- Cache hit rate: > 80%
- Live highlights: < 60 seconds delivery

### **User Engagement Goals**
- "For You" tab time: +40%
- Content interactions: +60%
- User satisfaction: >85%
- Fact accuracy: >90%

## 🚨 **Risk Mitigation**

### **Technical Risks**
- **API Cost Overrun**: Daily spending limits + usage monitoring
- **Content Quality**: Human review samples + user feedback loops
- **Performance Issues**: Real-time monitoring + cached fallbacks  
- **Fact Accuracy**: Source attribution + cross-referencing

### **Content Risks**
- **Bias Detection**: Monitor for team favoritism in AI summaries
- **Freshness**: Auto-expire stale content (24-hour max age)
- **Attribution**: Always link to original news sources
- **User Trust**: Transparent AI labeling + feedback collection

## 🎯 **Next Steps**

1. **Review** this implementation plan and provide feedback
2. **Set up** required API keys (OpenAI, NewsAPI)
3. **Start** with Phase 1 implementation (content ingestion pipeline)
4. **Test** with small user group before full rollout
5. **Monitor** costs and performance closely during development

This refined approach balances ambitious AI features with practical implementation constraints, ensuring you can deliver a compelling RAG-powered discovery feed without overcomplicating the architecture or exploding costs. 