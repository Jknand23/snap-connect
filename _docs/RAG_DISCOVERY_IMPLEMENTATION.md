# RAG-Powered Discovery Feed Implementation Guide

## 🎯 **Overview**
This document provides a comprehensive implementation guide for integrating RAG (Retrieval-Augmented Generation) into the Discovery feed of SnapConnect V2. The system uses multiple sports data sources to generate personalized content summaries.

### Architecture Overview
- **Primary Sources**: NewsAPI for headlines, BallDontLie for NBA data, API-Sports for detailed statistics
- **Vector Database**: Supabase pgvector for similarity search
- **AI Generation**: OpenAI GPT-4o-mini for cost-effective summaries
- **Personalization**: User team preferences and interaction history

### Data Source Strategy
**Phase 3A (Current)**:
- **NewsAPI**: Live sports headlines and descriptions (500 req/day free)
- **BallDontLie**: NBA scores, games, and player stats (unlimited free)
- **API-Sports**: Basic fixtures and team information (100 req/day free)

**Future Phases**:
- ~~API-SPORTS~~: Enhanced integration in Phase 3B
- ~~BallDontLie~~: Already integrated in Phase 3A
- **YouTube API**: Video highlights (Phase 3B)
- **Reddit RSS**: Fan discussions (Phase 3C)

**Key Goals**:
- Transform mock "For You" tab content into AI-generated personalized summaries
- Implement real-time highlight summaries during live games
- Maintain sub-3 second response times for content generation
- Keep costs under control with smart caching and batching strategies

## 🏗️ **Refined Architecture**

### **Why We're Keeping Supabase Vector (Not Switching to Pinecone)**

**Decision**: Keep existing Supabase Vector (pgvector) instead of migrating to Pinecone

**Rationale**:
- **Cost Efficiency**: pgvector is free vs Pinecone $70/month minimum
- **Unified Stack**: No additional vendor relationships or cross-service latency
- **Current Scale**: pgvector handles 1M+ vectors efficiently (sufficient for MVP)
- **SQL Integration**: Native SQL queries combining user data + vector similarity
- **Reduced Complexity**: No data synchronization between services

### **Simplified Data Source Strategy**

**Phase 1 Sources** (Immediate Implementation):
- **NewsAPI**: Sports news articles (500 requests/day free tier)
- **BallDontLie**: NBA scores, games, and player stats (unlimited free)
- **API-Sports**: Basic fixtures and team information (100 req/day free)

**Phase 2 Sources** (Future Enhancement):
- **Reddit RSS**: Fan sentiment and discussions
- **YouTube API**: Official team highlight videos

## 📋 **Implementation Requirements**

### **1. Content Ingestion Pipeline**

**Objective**: Automated fetching and processing of sports content for RAG retrieval

**Components**:
```typescript
// Content Ingestion Service
interface ContentIngestionConfig {
  sources: {
    newsapi: {
      endpoints: ['sports headlines'];
      updateFrequency: '1 hour';
      rateLimit: '500 requests/day';
    };
    ballDontLie: {
      endpoints: ['games', 'teams', 'players'];
      updateFrequency: '30 minutes';
      rateLimit: 'unlimited';
    };
    apiSports: {
      endpoints: ['fixtures', 'teams'];
      updateFrequency: '1 hour';
      rateLimit: '100 requests/day';
    };
  };
  processing: {
    embeddingModel: 'text-embedding-3-small';
    batchSize: 50; // Process 50 articles at once
    deduplicationThreshold: 0.95; // Vector similarity for duplicates
  };
}

class ContentIngestionService {
  async ingestContent(): Promise<void> {
    // 1. Fetch from data sources
    const [newsApiContent, ballDontLieContent, apiSportsContent] = await Promise.all([
      this.fetchNewsAPIContent(),
      this.fetchBallDontLieContent(),
      this.fetchApiSportsContent(),
    ]);
    
    // 2. Deduplicate articles
    const uniqueContent = this.deduplicateContent([...newsApiContent, ...ballDontLieContent, ...apiSportsContent]);
    
    // 3. Generate embeddings in batches
    const embeddedContent = await this.generateEmbeddings(uniqueContent);
    
    // 4. Store in Supabase with pgvector
    await this.storeContent(embeddedContent);
  }
}
```

**Database Schema**:
```sql
-- Content storage with embeddings
CREATE TABLE sports_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- Auto-generated summary for quick reading
  source_url TEXT,
  source_api TEXT CHECK (source_api IN ('newsapi', 'balldontlie', 'apisports')),
  content_type TEXT CHECK (content_type IN ('news', 'score', 'analysis')),
  teams TEXT[], -- ['DAL', 'LAL'] team IDs mentioned
  players TEXT[], -- Player names mentioned
  publish_date TIMESTAMP WITH TIME ZONE,
  embedding VECTOR(1536), -- text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_content_teams ON sports_content USING GIN(teams),
  INDEX idx_content_publish ON sports_content(publish_date DESC),
  INDEX USING hnsw (embedding vector_cosine_ops)
);
```

### **2. User Personalization System**

**Objective**: Build comprehensive user preference profiles for content personalization

**User Profile Schema**:
```typescript
interface UserPersonalizationProfile {
  userId: string;
  preferences: {
    favoriteTeams: string[]; // ['DAL', 'LAL', 'BOS']
    favoritePlayers: string[]; // ['Dak Prescott', 'LeBron James']
    readingStyle: 'concise' | 'detailed' | 'bullet-points';
    contentTypes: ('breaking' | 'analysis' | 'injury' | 'trade')[];
    notificationTiming: 'immediate' | 'daily-digest' | 'weekly';
  };
  interactionHistory: {
    likedContent: string[]; // Content IDs user engaged with
    shareHistory: string[]; // Content user shared
    timeSpentByCategory: Record<string, number>; // Minutes per content type
    lastActive: Date;
  };
  aiPreferences: {
    tone: 'neutral' | 'enthusiastic' | 'analytical';
    length: 'brief' | 'medium' | 'detailed';
    focus: 'team-centric' | 'player-centric' | 'league-wide';
  };
}
```

**Database Schema**:
```sql
CREATE TABLE user_personalization_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  favorite_teams TEXT[] DEFAULT '{}',
  favorite_players TEXT[] DEFAULT '{}',
  content_preferences JSONB DEFAULT '{
    "readingStyle": "concise",
    "contentTypes": ["breaking", "analysis"],
    "notificationTiming": "daily-digest"
  }',
  ai_preferences JSONB DEFAULT '{
    "tone": "neutral",
    "length": "brief",
    "focus": "team-centric"
  }',
  interaction_history JSONB DEFAULT '{
    "likedContent": [],
    "shareHistory": [],
    "timeSpentByCategory": {}
  }',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. RAG Content Generation Service**

**Objective**: Generate personalized content summaries using retrieved context

**Service Architecture**:
```typescript
class RAGContentGenerator {
  async generatePersonalizedFeed(userId: string): Promise<PersonalizedContent[]> {
    // 1. Get user personalization profile
    const userProfile = await this.getUserProfile(userId);
    
    // 2. Retrieve relevant content using vector similarity
    const relevantContent = await this.retrieveRelevantContent(userProfile);
    
    // 3. Generate personalized summaries
    const personalizedContent = await this.generateSummaries(relevantContent, userProfile);
    
    // 4. Cache results for performance
    await this.cacheGeneratedContent(userId, personalizedContent);
    
    return personalizedContent;
  }

  private async retrieveRelevantContent(profile: UserPersonalizationProfile): Promise<ContentItem[]> {
    // Create query embedding based on user preferences
    const queryText = `
      Sports news for ${profile.preferences.favoriteTeams.join(', ')} fan interested in 
      ${profile.preferences.contentTypes.join(', ')} with focus on 
      ${profile.preferences.favoritePlayers.join(', ')}
    `;
    
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    // Vector similarity search with user context
    const { data } = await this.supabase
      .from('sports_content')
      .select('*')
      .order('embedding <-> $1', { ascending: true })
      .filter('teams', 'overlap', profile.preferences.favoriteTeams)
      .filter('publish_date', 'gte', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .limit(10);
    
    return data || [];
  }

  private async generateSummaries(
    content: ContentItem[], 
    profile: UserPersonalizationProfile
  ): Promise<PersonalizedContent[]> {
    const summaries = await Promise.all(
      content.map(async (item) => {
        const prompt = this.buildPersonalizedPrompt(item, profile);
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini', // Cost-optimized model
          messages: [
            { role: 'system', content: SPORTS_SUMMARY_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 150, // Keep summaries concise
          temperature: 0.7,
        });
        
        return {
          id: item.id,
          originalContent: item,
          personalizedSummary: response.choices[0].message.content,
          relevanceScore: this.calculateRelevanceScore(item, profile),
          generatedAt: new Date(),
        };
      })
    );
    
    // Sort by relevance score
    return summaries.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private buildPersonalizedPrompt(content: ContentItem, profile: UserPersonalizationProfile): string {
    return `
      You are creating a personalized sports summary for a fan of: ${profile.preferences.favoriteTeams.join(', ')}.
      
      User preferences:
      - Reading style: ${profile.preferences.readingStyle}
      - Tone: ${profile.aiPreferences.tone}
      - Length: ${profile.aiPreferences.length}
      - Focus: ${profile.aiPreferences.focus}
      
      Original article:
      Title: ${content.title}
      Content: ${content.content}
      
      Create a ${profile.aiPreferences.length} summary that:
      1. Focuses on aspects relevant to ${profile.preferences.favoriteTeams.join(' and ')} fans
      2. Uses a ${profile.aiPreferences.tone} tone
      3. Highlights any mentions of: ${profile.preferences.favoritePlayers.join(', ')}
      4. Ends with a question or call-to-action to encourage engagement
      
      Summary:
    `;
  }
}
```

### **4. Real-time Game Event Processing**

**Objective**: Generate instant personalized summaries for live game events

**Live Event Pipeline**:
```typescript
class LiveGameProcessor {
  async startGameMonitoring(gameIds: string[]): Promise<void> {
    // Monitor live games every 30 seconds
    const interval = setInterval(async () => {
      for (const gameId of gameIds) {
        await this.processGameUpdates(gameId);
      }
    }, 30000);
    
    // Store interval for cleanup
    this.activeMonitors.set('live-games', interval);
  }

  private async processGameUpdates(gameId: string): Promise<void> {
    // 1. Fetch latest game events from NewsAPI and BallDontLie
    const gameEvents = await this.getGameEvents(gameId);
    const newEvents = gameEvents.filter(event => !this.isEventProcessed(event.id));
    
    if (newEvents.length === 0) return;
    
    // 2. Get subscribers for this game
    const subscribers = await this.getGameSubscribers(gameId);
    
    // 3. Generate personalized highlights for each subscriber
    for (const event of newEvents) {
      const highlights = await Promise.all(
        subscribers.map(userId => this.generatePersonalizedHighlight(event, userId))
      );
      
      // 4. Push to Discovery feeds
      await this.pushHighlightsToFeeds(highlights);
      
      // 5. Mark event as processed
      await this.markEventProcessed(event.id);
    }
  }

  private async generatePersonalizedHighlight(
    event: GameEvent, 
    userId: string
  ): Promise<PersonalizedHighlight> {
    const userProfile = await this.getUserProfile(userId);
    const userTeam = this.getUserTeamInGame(event.gameId, userProfile.favoriteTeams);
    
    const prompt = `
      Game Event: ${event.description}
      Score: ${event.homeScore} - ${event.awayScore}
      Time: ${event.quarter} quarter, ${event.timeRemaining}
      
      User's team: ${userTeam}
      User's interests: ${userProfile.preferences.contentTypes.join(', ')}
      
      Create a 1-sentence highlight from this ${userTeam} fan's perspective.
      ${userTeam === event.homeTeam ? 'Focus on home team performance.' : 'Focus on away team performance.'}
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.8,
    });
    
    return {
      userId,
      gameId: event.gameId,
      eventId: event.id,
      highlight: response.choices[0].message.content,
      timestamp: new Date(),
      userTeam,
    };
  }
}
```

### **5. Discovery Feed Integration**

**Objective**: Seamlessly integrate RAG content into existing Discovery screen

**Integration Strategy**:
```typescript
// Modified DiscoveryScreen.tsx
async function loadRAGForYouContent(): Promise<DiscoveryContent[]> {
  try {
    // 1. Check cache first
    const cachedContent = await ragCache.getUserContent(userId);
    if (cachedContent && !ragCache.isExpired(cachedContent)) {
      return formatForDiscoveryFeed(cachedContent);
    }
    
    // 2. Generate fresh content
    const ragContent = await ragService.generatePersonalizedFeed(userId);
    
    // 3. Convert to DiscoveryContent format
    const discoveryContent = ragContent.map(item => ({
      id: `rag-${item.id}`,
      type: 'ai-news-summary' as const,
      title: item.personalizedSummary.split('.')[0] + '.',
      description: item.personalizedSummary,
      media_url: item.originalContent.thumbnail_url,
      author: {
        id: 'snapconnect-ai',
        username: 'snapconnect_ai',
        full_name: 'SnapConnect AI',
        verified: true,
      },
      stats: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
      },
      engagement: {
        liked: false,
        saved: false,
      },
      timestamp: item.generatedAt.toISOString(),
      tags: ['AI-Generated', ...item.originalContent.teams],
      aiGenerated: true, // Flag for special handling
      relevanceScore: item.relevanceScore,
      sourceArticles: [item.originalContent], // Attribution
    }));
    
    // 4. Cache for performance
    await ragCache.setUserContent(userId, discoveryContent);
    
    return discoveryContent;
  } catch (error) {
    console.error('RAG content generation failed:', error);
    // Fallback to mock content
    return createMockForYouContent();
  }
}

// Add RAG-specific rendering
function renderRAGContent({ item }: { item: DiscoveryContent }) {
  if (!item.aiGenerated) return renderDiscoveryItem({ item });
  
  return (
    <View className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl mb-4 overflow-hidden">
      {/* AI Badge */}
      <View className="flex-row items-center p-3 pb-2">
        <View className="bg-blue-500 px-2 py-1 rounded-full mr-2">
          <Text className="text-white text-xs font-bold">AI GENERATED</Text>
        </View>
        <Text className="text-blue-300 text-xs">
          Personalized for you • {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      
      {/* Content */}
      <View className="px-4 pb-4">
        <Text className="text-white font-semibold text-lg mb-2">
          {item.title}
        </Text>
        <Text className="text-gray-300 text-sm leading-relaxed">
          {item.description}
        </Text>
        
        {/* Source Attribution */}
        <TouchableOpacity 
          className="flex-row items-center mt-3 p-2 bg-black/20 rounded-lg"
          onPress={() => Linking.openURL(item.sourceArticles[0]?.source_url)}
        >
          <Text className="text-blue-400 text-xs">📰 Source: {item.sourceArticles[0]?.source_api.toUpperCase()}</Text>
        </TouchableOpacity>
        
        {/* Feedback Buttons */}
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row space-x-4">
            <TouchableOpacity onPress={() => handleRAGFeedback(item.id, 'helpful')}>
              <Text className="text-green-400">👍 Helpful</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRAGFeedback(item.id, 'not-relevant')}>
              <Text className="text-red-400">👎 Not relevant</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-500 text-xs">
            Relevance: {Math.round(item.relevanceScore * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
}
```

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
- [ ] Set up content ingestion pipeline (NewsAPI + BallDontLie + API-Sports)
- [ ] Implement basic vector embedding generation
- [ ] Create user personalization profile system
- [ ] Build RAG content generation service

### **Phase 2: Integration (Week 2)**
- [ ] Integrate RAG service with Discovery screen
- [ ] Implement caching layer for performance
- [ ] Add user feedback collection for AI content
- [ ] Create fallback mechanisms for API failures

### **Phase 3: Real-time Features (Week 3)**
- [ ] Implement live game event monitoring
- [ ] Build real-time highlight generation
- [ ] Add push notification system for live events
- [ ] Optimize performance for concurrent users

### **Phase 4: Optimization (Week 4)**
- [ ] Performance testing and optimization
- [ ] Cost monitoring and optimization
- [ ] A/B testing for content relevance
- [ ] User experience refinements

## 📊 **Success Metrics**

### **Performance Metrics**
- Content generation time: < 3 seconds
- Vector search latency: < 500ms
- Cache hit rate: > 80%
- API cost per user per day: < $0.05

### **User Engagement Metrics**
- Time spent in "For You" tab: +40%
- Content interaction rate: +60%
- User feedback satisfaction: > 85%
- Daily active user retention: +25%

### **Technical Metrics**
- Fact accuracy verification: > 90%
- Content deduplication rate: > 95%
- System uptime: > 99.5%
- Real-time highlight delivery: < 60 seconds

## 💰 **Cost Management**

### **Monthly Cost Estimates**
- OpenAI Embeddings (text-embedding-3-small): ~$20/month (1M tokens)
- OpenAI Chat (GPT-4o-mini): ~$50/month (5M tokens)
- NewsAPI: 500 requests/day free tier (sufficient for MVP)
- BallDontLie: Unlimited free NBA data
- NewsAPI: Free tier (sufficient for MVP)
- **Total**: ~$70/month (vs $70+ for Pinecone alone)

### **Cost Optimization Strategies**
- Batch embedding generation (50 articles at once)
- 6-hour cache for generated content
- Rate limiting: 20 generations per user per day
- Smart fallback to cached content during peak usage

## 🔧 **Technical Requirements**

### **Dependencies**
```json
{
  "openai": "^4.20.0",
  "supabase": "^2.39.0",
  "node-cron": "^3.0.3"
}
```

### **Environment Variables**
```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
NEWSAPI_API_KEY=... (required for sports headlines)
API_SPORTS_API_KEY=... (optional for enhanced stats)
NEWSAPI_KEY=... (required)
```

### **Supabase Edge Functions**
- `rag-content-generator`: Main RAG orchestration
- `content-ingestion`: Automated content fetching
- `live-game-processor`: Real-time game event processing

This implementation provides a solid foundation for RAG-powered personalized content while maintaining cost efficiency and system reliability. 