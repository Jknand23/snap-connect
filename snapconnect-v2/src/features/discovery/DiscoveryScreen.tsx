/**
 * Discovery Screen
 * 
 * Personalized sports content discovery featuring AI-curated feed based on user preferences,
 * trending sports content, team updates, player highlights, and interactive social features.
 * Acts as the main content consumption hub for sports fans.
 * 
 * Features persistent Stories section at top with tabbed content sections below:
 * - For You (default): Personalized content and insider information
 * - Scores: Live game scores and standings
 * - Highlights: Video highlights and key moments
 * - News: Latest sports news and breaking updates
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../stores/authStore';
import { storiesService, StoryFeed, StoryWithProfile } from '../../services/stories/storiesService';
import { teamsService } from '../../services/database/teamsService';
import { supabase } from '../../services/database/supabase';
import { Database } from '../../types/database';
import { getPersonalizedSummary, submitRAGFeedback } from '../../services/rag/ragService';
import { scoresService, GameScore, LeagueScores } from '../../services/sports/scoresService';
import { getRecentHighlights } from '../../services/highlights/highlightsService';
import { getIndividualNewsArticles, NewsArticle } from '../../services/news/newsService';

type Team = Database['public']['Tables']['teams']['Row'];

type DiscoveryStackParamList = {
  DiscoveryMain: undefined;
  StoryCreator: undefined;
  UserProfile: { userId: string };
  TeamProfile: { teamId: string };
  ContentDetails: { contentId: string };
};

type DiscoveryScreenNavigationProp = StackNavigationProp<DiscoveryStackParamList, 'DiscoveryMain'>;

// Tab types for content sections
type ContentTab = 'for-you' | 'scores' | 'highlights' | 'news';

// Content types for the discovery feed
interface DiscoveryContent {
  id: string;
  type: 'story' | 'highlight' | 'news' | 'trending' | 'live_event' | 'insider' | 'score';
  title: string;
  description?: string;
  media_url?: string;
  thumbnail_url?: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    verified?: boolean;
  };
  team?: {
    id: string;
    name: string;
    logo_url?: string;
    primary_color: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  engagement: {
    liked: boolean;
    saved: boolean;
  };
  timestamp: string;
  tags: string[];
  isLive?: boolean;
  duration?: number;
  // Score-specific fields
  score?: {
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
    status: 'live' | 'final' | 'upcoming';
    quarter?: string;
    time_remaining?: string;
  };
  // AI-specific fields for Phase 3A Week 2
  aiGenerated?: boolean;
  cached?: boolean;
  sourceAttribution?: string;
  relevanceScore?: number;
  userFeedback?: 'helpful' | 'not-relevant' | null;
  // News-specific fields
  fullContent?: string; // Full article content for expansion
  summary?: string; // Short summary for collapsed view
  source_url?: string; // Original article URL
  published_at?: string; // Publication date
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function DiscoveryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<DiscoveryScreenNavigationProp>();
  
  const [storiesFeed, setStoriesFeed] = useState<StoryFeed[]>([]);
  const [forYouFeed, setForYouFeed] = useState<DiscoveryContent[]>([]);
  const [scoresFeed, setScoresFeed] = useState<DiscoveryContent[]>([]);
  const [highlightsFeed, setHighlightsFeed] = useState<DiscoveryContent[]>([]);
  const [newsFeed, setNewsFeed] = useState<DiscoveryContent[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<Team[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<ContentTab>('for-you');
  
  // News-specific state for expandable articles
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [loadingNewsDetails, setLoadingNewsDetails] = useState<Set<string>>(new Set());

  // Story viewer state
  const [selectedStoryFeed, setSelectedStoryFeed] = useState<StoryFeed | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isStoryViewVisible, setIsStoryViewVisible] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Load initial data including stories, content feed, and user preferences
   */
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Listen for story updates to refresh the feed when stories are created
   */
  useEffect(() => {
    const subscription = storiesService.subscribeToFriendsStories((story) => {
      console.log('📱 New story received, refreshing feed:', story.id);
      loadStoriesFeed(); // Refresh the stories feed when a new story is created
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Cleanup story progress timer on unmount
   */
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  /**
   * Load content for active tab when tab changes
   */
  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab]);

  /**
   * Load all discovery screen data
   */
  async function loadInitialData() {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStoriesFeed(),
        loadTabContent('for-you'), // Load default tab content
        loadFavoriteTeams(),
        loadTrendingTopics(),
      ]);
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Load content based on selected tab
   */
  async function loadTabContent(tab: ContentTab) {
    try {
      switch (tab) {
        case 'for-you':
          await loadForYouContent();
          break;
        case 'scores':
          await loadScoresContent();
          break;
        case 'highlights':
          await loadHighlightsContent();
          break;
        case 'news':
          await loadNewsContent();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} content:`, error);
    }
  }

  /**
   * Load stories feed from friends and followed users
   */
  async function loadStoriesFeed() {
    try {
      const feed = await storiesService.getStoriesFeed();
      setStoriesFeed(feed);
      console.log('✅ Stories feed loaded:', feed.length, 'users with stories');
      
      // If no stories found, create some test stories for demo
      if (feed.length === 0) {
        console.log('📝 No stories found, creating test data...');
        createTestStoriesFallback();
      }
    } catch (error) {
      console.error('❌ Failed to load stories feed:', error);
      createTestStoriesFallback();
    }
  }

  /**
   * Load personalized "For You" content including insider information
   */
  async function loadForYouContent() {
    try {
      // Get the current user's ID for personalization
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        console.warn('⚠️ No authenticated user found, falling back to mock content');
        createMockForYouContent();
        return;
      }

      // Attempt to fetch AI-powered summary from Edge Function
      const result = await getPersonalizedSummary(userId);

      if (!result || !result.summary) {
        console.warn('⚠️ No RAG summary returned, falling back to mock content');
        createMockForYouContent();
        return;
      }

      // Convert summary string into multiple DiscoveryContent items for better engagement
      const aiContentItems: DiscoveryContent[] = [
        {
          id: `ai-summary-${Date.now()}`,
          type: 'insider',
          title: 'Your Personalized Sports Briefing',
          description: result.summary,
          author: {
            id: 'snapconnect_ai',
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
          timestamp: new Date().toISOString(),
          tags: ['AI', 'Personalized', 'Sports'],
          // Add AI-specific metadata for Week 2 enhancements
          aiGenerated: true,
          cached: result.cached,
          sourceAttribution: 'NewsAPI, BallDontLie, API-Sports',
          relevanceScore: 0.95, // High relevance for personalized content
        }
      ];

      // Mix AI content with some mock content for better UX during Week 2
      const mixedContent = [
        ...aiContentItems,
        ...createMockForYouContent().slice(0, 2) // Add 2 mock items for variety
      ];

      setForYouFeed(mixedContent);
      console.log(`✅ Loaded AI summary (cached=${result.cached}) + ${mixedContent.length - 1} supplementary items`);
    } catch (error) {
      console.error('❌ Failed to load For You content:', error);
      createMockForYouContent();
    }
  }

  /**
   * Load scores and standings content
   */
  async function loadScoresContent() {
    try {
      console.log('🔄 Loading real-time scores...');
      
      const leagueScores = await scoresService.getUserScores();
      
      if (leagueScores.length === 0) {
        // No leagues selected or no games found
        setScoresFeed([]);
        console.log('✅ No scores to display (no leagues selected or no games)');
        return;
      }

      // Convert league scores to discovery content format
      const scoresContent: DiscoveryContent[] = [];
      
      leagueScores.forEach(leagueData => {
        leagueData.games.forEach(game => {
          scoresContent.push({
            id: game.id,
            type: 'score',
            title: `${game.awayTeam.abbreviation} vs ${game.homeTeam.abbreviation}`,
            description: game.venue || `${game.league} Game`,
            author: {
              id: `${game.league.toLowerCase()}-scores`,
              username: `${game.league.toLowerCase()}_scores`,
              full_name: `${game.league} Scores`,
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
            timestamp: game.date,
            tags: [game.league, game.homeTeam.abbreviation, game.awayTeam.abbreviation],
            isLive: game.status === 'live',
                         score: {
               home_team: game.homeTeam.name,
               away_team: game.awayTeam.name,
               home_score: game.homeTeam.score,
               away_score: game.awayTeam.score,
               status: game.status === 'scheduled' ? 'upcoming' : 
                      game.status === 'postponed' ? 'upcoming' : 
                      game.status,
               quarter: game.quarter,
               time_remaining: game.timeRemaining,
             },
          });
        });
      });

      // Sort by live games first, then by date
      scoresContent.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setScoresFeed(scoresContent);
      console.log(`✅ Loaded ${scoresContent.length} real-time scores from ${leagueScores.length} leagues`);
    } catch (error) {
      console.error('❌ Failed to load real-time scores:', error);
      // Fallback to empty state instead of mock data
      setScoresFeed([]);
    }
  }

  /**
   * Load highlights and video content
   * Fetches real video highlights from the database within the last 24 hours
   */
  async function loadHighlightsContent() {
    try {
      console.log('🎬 Loading highlights content...');
      
      if (!user?.id) {
        console.log('❌ No user ID available for highlights personalization');
        setHighlightsFeed([]);
        return;
      }

      // Get user's favorite teams for personalized highlights
      const userFavoriteTeams = favoriteTeams.map(team => team.name);
      
      // Fetch real highlights from the database
      const realHighlights = await getRecentHighlights(
        user.id,
        userFavoriteTeams.length > 0 ? userFavoriteTeams : undefined,
        8 // Limit to 8 highlights for better performance
      );

      if (realHighlights.length > 0) {
        // Transform highlights to DiscoveryContent format
        const highlightContent: DiscoveryContent[] = realHighlights.map(highlight => ({
          id: highlight.id,
          type: 'highlight' as const,
          title: highlight.title,
          description: highlight.description,
          media_url: highlight.media_url,
          thumbnail_url: highlight.thumbnail_url,
          author: highlight.author,
          team: highlight.team,
          stats: highlight.stats,
          engagement: highlight.engagement,
          timestamp: highlight.timestamp,
          tags: highlight.tags,
          duration: highlight.duration,
          sourceAttribution: highlight.sourceAttribution,
        }));

        setHighlightsFeed(highlightContent);
        console.log(`✅ Loaded ${highlightContent.length} real highlights`);
      } else {
        console.log('📺 No recent highlights found');
        setHighlightsFeed([]);
      }
    } catch (error) {
      console.error('❌ Failed to load Highlights content:', error);
      // Show empty state on error instead of mock data
      setHighlightsFeed([]);
    }
  }

  /**
   * Load latest news content
   */
  async function loadNewsContent() {
    try {
      if (!user?.id) {
        console.warn('No user ID available for news content');
        createMockNewsContent();
        return;
      }

      console.log('🗞️ Loading individual news articles...');
      
      // Use news service to get individual articles (not summaries)
      const newsArticles = await getIndividualNewsArticles(user.id, {
        maxArticles: 10,
        forceRefresh: false
      });

      if (newsArticles.length > 0) {
        // Transform NewsArticle objects to DiscoveryContent format
        const discoveryNewsItems: DiscoveryContent[] = newsArticles.map((article: NewsArticle) => ({
          id: article.id,
          type: 'news' as const,
          title: article.title,
          description: article.summary,
          summary: article.summary,
          fullContent: article.fullContent,
          source_url: article.source_url,
          published_at: article.published_at,
          media_url: article.media_url,
          thumbnail_url: article.thumbnail_url,
          author: {
            id: `${article.source_name.toLowerCase().replace(/\s+/g, '')}-reporter`,
            username: `${article.source_name.toLowerCase().replace(/\s+/g, '')}_reporter`,
            full_name: article.author || article.source_name,
            avatar_url: `https://via.placeholder.com/100x100/1E40AF/ffffff?text=${article.source_name.charAt(0).toUpperCase()}`,
            verified: true,
          },
          team: article.teams && article.teams.length > 0 ? {
            id: article.teams[0].toLowerCase(),
            name: article.teams[0],
            primary_color: '#1E40AF',
          } : undefined,
          stats: {
            likes: Math.floor(Math.random() * 1000) + 100,
            comments: Math.floor(Math.random() * 100) + 10,
            shares: Math.floor(Math.random() * 50) + 5,
            views: Math.floor(Math.random() * 5000) + 500,
          },
          engagement: {
            liked: false,
            saved: false,
          },
          timestamp: article.published_at,
          tags: article.tags,
          aiGenerated: false, // These are real articles, not AI-generated
          cached: false,
          sourceAttribution: article.source_name,
          relevanceScore: article.engagement_score || 0.7,
          userFeedback: null,
        }));

        setNewsFeed(discoveryNewsItems);
        console.log(`✅ Loaded ${discoveryNewsItems.length} individual news articles`);
        return;
      }

      console.warn('No news articles available, falling back to mock content');
      createMockNewsContent();
    } catch (error) {
      console.error('❌ Failed to load News content:', error);
      createMockNewsContent();
    }
  }



  /**
   * Get display name for source API
   */
  function getSourceDisplayName(sourceApi: string): string {
    const sourceMap: Record<string, string> = {
      'newsapi': 'Sports News Network',
      'ballDontLie': 'NBA Data Central',
      'apiSports': 'Sports Statistics',
      'youtube': 'Sports Highlights',
      'reddit': 'Fan Community',
    };
    return sourceMap[sourceApi] || 'Sports Reporter';
  }

  /**
   * Create mock "For You" feed with personalized and insider content
   */
  function createMockForYouContent(): DiscoveryContent[] {
    const mockContent: DiscoveryContent[] = [
      {
        id: 'insider-1',
        type: 'insider',
        title: 'Cowboys Practice Report: Key Players Missing',
        description: 'Exclusive: Three starters absent from Tuesday practice ahead of Sunday\'s game',
        media_url: 'https://via.placeholder.com/400x300/1E40AF/ffffff?text=Practice+Report',
        author: {
          id: 'insider-reporter',
          username: 'cowboys_insider',
          full_name: 'Cowboys Insider',
          avatar_url: 'https://via.placeholder.com/100x100/1E40AF/ffffff?text=CI',
          verified: true,
        },
        team: {
          id: 'team-1',
          name: 'Dallas Cowboys',
          primary_color: '#003594',
        },
        stats: {
          likes: 1240,
          comments: 89,
          shares: 234,
          views: 8900,
        },
        engagement: {
          liked: false,
          saved: true,
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        tags: ['Cowboys', 'Practice', 'Insider', 'NFL'],
      },
      {
        id: 'trending-1',
        type: 'trending',
        title: 'Your Teams This Week: What to Watch',
        description: 'Personalized preview of your favorite teams\' upcoming games and storylines',
        media_url: 'https://via.placeholder.com/400x300/059669/ffffff?text=Weekly+Preview',
        author: {
          id: 'ai-curator',
          username: 'snapconnect_ai',
          full_name: 'SnapConnect AI',
          verified: true,
        },
        stats: {
          likes: 892,
          comments: 56,
          shares: 123,
          views: 5670,
        },
        engagement: {
          liked: true,
          saved: false,
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ['AI', 'Preview', 'Personalized'],
      },
      {
        id: 'insider-2',
        type: 'insider',
        title: 'LIVE: Coach Press Conference',
        description: 'Head coach discussing game plan and injury updates',
        media_url: 'https://via.placeholder.com/400x300/EF4444/ffffff?text=LIVE+Press',
        author: {
          id: 'team-official',
          username: 'cowboys_official',
          full_name: 'Dallas Cowboys',
          verified: true,
        },
        team: {
          id: 'team-1',
          name: 'Dallas Cowboys',
          primary_color: '#003594',
        },
        stats: {
          likes: 2341,
          comments: 189,
          shares: 456,
          views: 12340,
        },
        engagement: {
          liked: false,
          saved: false,
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        tags: ['Cowboys', 'Press Conference', 'Live', 'Coach'],
        isLive: true,
      },
    ];

    setForYouFeed(mockContent);
    console.log('✅ Mock For You feed created:', mockContent.length, 'items');
    return mockContent;
  }

  /**
   * Create mock scores content
   */
  function createMockScoresContent() {
    const mockContent: DiscoveryContent[] = [
      {
        id: 'score-1',
        type: 'score',
        title: 'Cowboys vs Giants',
        description: 'Live from MetLife Stadium',
        author: {
          id: 'nfl-scores',
          username: 'nfl_scores',
          full_name: 'NFL Scores',
          verified: true,
        },
        team: {
          id: 'team-1',
          name: 'Dallas Cowboys',
          primary_color: '#003594',
        },
        stats: {
          likes: 5432,
          comments: 892,
          shares: 234,
          views: 45600,
        },
        engagement: {
          liked: false,
          saved: false,
        },
        timestamp: new Date().toISOString(),
        tags: ['NFL', 'Cowboys', 'Giants', 'Live'],
        isLive: true,
        score: {
          home_team: 'Giants',
          away_team: 'Cowboys',
          home_score: 14,
          away_score: 21,
          status: 'live',
          quarter: '3rd',
          time_remaining: '8:34',
        },
      },
      {
        id: 'score-2',
        type: 'score',
        title: 'Lakers vs Warriors',
        description: 'Final from Chase Center',
        author: {
          id: 'nba-scores',
          username: 'nba_scores',
          full_name: 'NBA Scores',
          verified: true,
        },
        stats: {
          likes: 3421,
          comments: 567,
          shares: 189,
          views: 23400,
        },
        engagement: {
          liked: true,
          saved: false,
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ['NBA', 'Lakers', 'Warriors', 'Final'],
        score: {
          home_team: 'Warriors',
          away_team: 'Lakers',
          home_score: 112,
          away_score: 108,
          status: 'final',
        },
      },
    ];

    setScoresFeed(mockContent);
    console.log('✅ Mock Scores feed created:', mockContent.length, 'items');
  }

  /**
   * Create mock highlights content
   */
  // Mock highlights function removed - now shows proper empty state when no highlights available

  /**
   * Create mock news content
   */
  function createMockNewsContent() {
    const mockContent: DiscoveryContent[] = [
      {
        id: 'news-1',
        type: 'news',
        title: 'Trade deadline approaching: Who\'s on the move?',
        description: 'Multiple sources report potential blockbuster deals in the works as deadline nears',
        summary: 'Multiple sources report potential blockbuster deals in the works as deadline nears. Front offices are reportedly making final calls on key trades.',
        fullContent: 'Multiple sources report potential blockbuster deals in the works as deadline nears. Front offices across the league are reportedly making final calls on key trades that could reshape the playoff picture. Several All-Star caliber players are rumored to be available, with teams looking to either make a playoff push or begin rebuilding for next season. NBA insiders suggest that this could be one of the most active trade deadlines in recent memory, with at least 5-6 major moves expected before the 3 PM ET cutoff. General managers have been working phones constantly, trying to find the right pieces to complete championship puzzles or maximize future assets. The next 48 hours will be crucial for several franchises.',
        media_url: 'https://via.placeholder.com/400x300/EF4444/ffffff?text=Trade+News',
        source_url: 'https://example.com/trade-deadline-news',
        published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        author: {
          id: 'sports-news',
          username: 'sports_news',
          full_name: 'Sports News Central',
          avatar_url: 'https://via.placeholder.com/100x100/EF4444/ffffff?text=SN',
          verified: true,
        },
        stats: {
          likes: 5672,
          comments: 1834,
          shares: 892,
          views: 67891,
        },
        engagement: {
          liked: false,
          saved: true,
        },
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        tags: ['NBA', 'Trade', 'Deadline', 'Breaking'],
        aiGenerated: false,
        sourceAttribution: 'Sports News Central',
        userFeedback: null,
      },
      {
        id: 'news-2',
        type: 'news',
        title: 'Injury update: Star player expected to return',
        description: 'Medical team optimistic about recovery timeline for playoff push',
        summary: 'Medical team optimistic about recovery timeline for playoff push. Team doctors report significant progress in rehabilitation.',
        fullContent: 'Medical team optimistic about recovery timeline for playoff push. Team doctors report significant progress in rehabilitation, with the star player showing excellent response to treatment protocols. The injury, initially feared to be season-ending, now appears to be healing ahead of schedule. Team medical staff credit the player\'s dedication to the recovery process and advanced treatment methods. If current progress continues, the player could return to action within 2-3 weeks, just in time for the crucial final stretch of the regular season. The team has been cautious not to rush the recovery, prioritizing long-term health over short-term gains. Teammates and coaching staff are reportedly excited about the potential return.',
        media_url: 'https://via.placeholder.com/400x300/10B981/ffffff?text=Injury+Update',
        source_url: 'https://example.com/injury-update-news',
        published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        author: {
          id: 'medical-reporter',
          username: 'injury_insider',
          full_name: 'Medical Sports Reporter',
          avatar_url: 'https://via.placeholder.com/100x100/10B981/ffffff?text=MR',
          verified: true,
        },
        stats: {
          likes: 3421,
          comments: 567,
          shares: 234,
          views: 23456,
        },
        engagement: {
          liked: false,
          saved: false,
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        tags: ['Injury', 'Recovery', 'Playoff', 'Update'],
        aiGenerated: false,
        sourceAttribution: 'Medical Sports Reporter',
        userFeedback: null,
      },
      {
        id: 'news-3',
        type: 'news',
        title: 'Rookie sensation breaks franchise record',
        description: 'Young phenom surpasses 30-year-old team record in stunning performance',
        summary: 'Young phenom surpasses 30-year-old team record in stunning performance against division rivals. Fans and analysts praise incredible talent.',
        fullContent: 'Young phenom surpasses 30-year-old team record in stunning performance against division rivals. The rookie\'s exceptional display included career-high numbers that left fans and analysts in awe. The previous record had stood since 1994, held by a franchise legend who was in attendance to witness the historic moment. The young player\'s versatility and basketball IQ have been remarkable throughout the season, but last night\'s performance solidified their status as a future superstar. Teammates rallied around the achievement, with veteran players praising the rookie\'s work ethic and dedication. Coaches are already drawing comparisons to some of the greatest players in franchise history. The record-breaking performance has also put the rookie in early conversation for Rookie of the Year honors.',
        media_url: 'https://via.placeholder.com/400x300/9333EA/ffffff?text=Rookie+Record',
        source_url: 'https://example.com/rookie-record-news',
        published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        author: {
          id: 'franchise-reporter',
          username: 'team_insider',
          full_name: 'Franchise Beat Reporter',
          avatar_url: 'https://via.placeholder.com/100x100/9333EA/ffffff?text=FR',
          verified: true,
        },
        team: {
          id: 'team-1',
          name: 'Local Team',
          primary_color: '#9333EA',
        },
        stats: {
          likes: 8934,
          comments: 2156,
          shares: 1456,
          views: 45678,
        },
        engagement: {
          liked: false,
          saved: false,
        },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        tags: ['Rookie', 'Record', 'Franchise', 'History'],
        aiGenerated: false,
        sourceAttribution: 'Franchise Beat Reporter',
        userFeedback: null,
      },
    ];

    setNewsFeed(mockContent);
    console.log('✅ Mock News feed created:', mockContent.length, 'items');
  }

  /**
   * Load trending topics and hashtags
   */
  async function loadTrendingTopics() {
    try {
      // TODO: Implement trending topics service
      const mockTrending = [
        '#GameDay', '#NBA', '#TradeDeadline', '#SuperBowl', 
        '#March Madness', '#Playoffs', '#ChampionshipSunday'
      ];
      setTrendingTopics(mockTrending);
    } catch (error) {
      console.error('Error loading trending topics:', error);
    }
  }

  /**
   * Create fallback test stories data
   */
  function createTestStoriesFallback() {
    const mockStoriesFeed: StoryFeed[] = [
      {
        user: {
          id: 'test-user-1',
          username: 'sports_fan_alex',
          full_name: 'Alex Johnson',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bio: 'Sports enthusiast',
        },
        stories: [
          {
            id: 'test-story-1',
            user_id: 'test-user-1',
            media_url: 'https://via.placeholder.com/400x600/1E40AF/ffffff?text=Game+Day!',
            media_type: 'photo' as const,
            caption: 'Game day! 🏈',
            privacy_setting: 'public' as const,
            team_filter: null,
            thumbnail_url: null,
            duration: 0,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            view_count: 5,
            profiles: {
              id: 'test-user-1',
              username: 'sports_fan_alex',
              full_name: 'Alex Johnson',
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              bio: 'Sports enthusiast',
            },
            has_viewed: false,
            viewer_count: 5,
          }
        ],
        hasUnviewed: true,
      },
      {
        user: {
          id: 'test-user-2',
          username: 'team_captain',
          full_name: 'Sarah Williams',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bio: 'Team captain',
        },
        stories: [
          {
            id: 'test-story-2',
            user_id: 'test-user-2',
            media_url: 'https://via.placeholder.com/400x600/059669/ffffff?text=Victory!',
            media_type: 'photo' as const,
            caption: 'We won! 🏆',
            privacy_setting: 'public' as const,
            team_filter: null,
            thumbnail_url: null,
            duration: 0,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            view_count: 12,
            profiles: {
              id: 'test-user-2',
              username: 'team_captain',
              full_name: 'Sarah Williams',
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              bio: 'Team captain',
            },
            has_viewed: false,
            viewer_count: 12,
          }
        ],
        hasUnviewed: true,
      }
    ];

    setStoriesFeed(mockStoriesFeed);
    console.log('✅ Test stories created:', mockStoriesFeed.length, 'users');
  }

  /**
   * Load user's favorite teams
   */
  async function loadFavoriteTeams() {
    try {
      const teams = await teamsService.getUserFavoriteTeams();
      setFavoriteTeams(teams);
    } catch (error) {
      console.error('Error loading favorite teams:', error);
    }
  }

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadStoriesFeed(),
      loadTabContent(activeTab),
      loadFavoriteTeams(),
      loadTrendingTopics(),
    ]);
    setIsRefreshing(false);
  }, [activeTab]);

  /**
   * Handle content interaction (like, comment, share)
   */
  function handleContentInteraction(contentId: string, action: 'like' | 'comment' | 'share' | 'save') {
    const updateFeed = (prev: DiscoveryContent[]) => 
      prev.map(item => {
        if (item.id === contentId) {
          const updatedItem = { ...item };
          switch (action) {
            case 'like':
              updatedItem.engagement.liked = !updatedItem.engagement.liked;
              updatedItem.stats.likes += updatedItem.engagement.liked ? 1 : -1;
              break;
            case 'save':
              updatedItem.engagement.saved = !updatedItem.engagement.saved;
              break;
            case 'comment':
              // TODO: Navigate to comments screen
              console.log('Navigate to comments for:', contentId);
              break;
            case 'share':
              updatedItem.stats.shares += 1;
              // TODO: Implement share functionality
              console.log('Share content:', contentId);
              break;
          }
          return updatedItem;
        }
        return item;
      });

    // Update the appropriate feed based on active tab
    switch (activeTab) {
      case 'for-you':
        setForYouFeed(updateFeed);
        break;
      case 'scores':
        setScoresFeed(updateFeed);
        break;
      case 'highlights':
        setHighlightsFeed(updateFeed);
        break;
      case 'news':
        setNewsFeed(updateFeed);
        break;
    }
  }

  /**
   * Handle RAG feedback for AI-generated content (Phase 3A Week 2)
   */
  async function handleRAGFeedback(contentId: string, feedback: 'helpful' | 'not-relevant') {
    const updateFeed = (prev: DiscoveryContent[]) => 
      prev.map(item => {
        if (item.id === contentId && item.aiGenerated) {
          console.log(`📝 RAG Feedback: ${feedback} for content ${contentId}`);
          return { ...item, userFeedback: feedback };
        }
        return item;
      });

    // Update the appropriate feed
    switch (activeTab) {
      case 'for-you':
        setForYouFeed(updateFeed);
        break;
      case 'scores':
        setScoresFeed(updateFeed);
        break;
      case 'highlights':
        setHighlightsFeed(updateFeed);
        break;
      case 'news':
        setNewsFeed(updateFeed);
        break;
    }

    // Submit feedback to RAG service for learning (Phase 3A Week 2)
    try {
      await submitRAGFeedback({
        contentId,
        feedbackType: feedback,
        sourceAttribution: ['NewsAPI', 'BallDontLie', 'API-Sports'],
        contextMetadata: {
          content_type: 'news-summary',
          position_in_feed: 0,
          source_api: 'multi-source'
        }
      });

      Alert.alert(
        'Feedback Received', 
        `Thank you! Your feedback helps improve our AI recommendations.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to submit RAG feedback:', error);
      Alert.alert(
        'Feedback Error', 
        'Failed to submit feedback, but your preference has been saved locally.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Handle expanding/collapsing news articles
   */
  function toggleArticleExpansion(articleId: string) {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  }

  /**
   * Handle news-specific feedback with enhanced tracking
   */
  async function handleNewsFeedback(articleId: string, feedback: 'helpful' | 'not-relevant') {
    try {
      console.log(`📰 News feedback: ${feedback} for article ${articleId}`);
      
      // Update the news feed state
      setNewsFeed(prev => 
        prev.map(item => {
          if (item.id === articleId) {
            return { ...item, userFeedback: feedback };
          }
          return item;
        })
      );

      // Submit feedback to RAG service with news-specific context
      await submitRAGFeedback({
        contentId: articleId,
        feedbackType: feedback as 'helpful' | 'not-relevant',
        sourceAttribution: newsFeed.find(item => item.id === articleId)?.sourceAttribution ? 
          [newsFeed.find(item => item.id === articleId)!.sourceAttribution!] : undefined,
        contextMetadata: {
          content_type: 'news',
          position_in_feed: newsFeed.findIndex(item => item.id === articleId),
          source_api: newsFeed.find(item => item.id === articleId)?.author.username.replace('_reporter', '') || 'unknown'
        }
      });

      Alert.alert(
        'News Feedback Received', 
        'Thank you! Your feedback helps us personalize your news experience.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to submit news feedback:', error);
      Alert.alert(
        'Feedback Error', 
        'Failed to submit feedback, but your preference has been saved.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Get current tab content
   */
  function getCurrentTabContent(): DiscoveryContent[] {
    switch (activeTab) {
      case 'for-you':
        return forYouFeed;
      case 'scores':
        return scoresFeed;
      case 'highlights':
        return highlightsFeed;
      case 'news':
        return newsFeed;
      default:
        return forYouFeed;
    }
  }

  /**
   * Handle tab change
   */
  function handleTabChange(tab: ContentTab) {
    setActiveTab(tab);
  }

  /**
   * Format engagement numbers (1234 -> 1.2K)
   */
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Format timestamp for display
   */
  function formatTimestamp(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return `${minutes}m ago`;
  }

  // Story viewer functions
  /**
   * Open story viewer modal
   */
  function openStoryViewer(storyFeed: StoryFeed, startIndex: number = 0) {
    setSelectedStoryFeed(storyFeed);
    setCurrentStoryIndex(startIndex);
    setIsStoryViewVisible(true);
    startStoryProgress();
  }

  /**
   * Close story viewer modal
   */
  function closeStoryViewer() {
    setIsStoryViewVisible(false);
    setSelectedStoryFeed(null);
    setCurrentStoryIndex(0);
    setStoryProgress(0);
    stopStoryProgress();
  }

  /**
   * Start story progress timer
   */
  function startStoryProgress() {
    setStoryProgress(0);
    progressInterval.current = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + 2; // 5 seconds per story (100 / 2 = 50 intervals of 100ms)
      });
    }, 100);
  }

  /**
   * Stop story progress timer
   */
  function stopStoryProgress() {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }

  /**
   * Navigate to next story
   */
  function nextStory() {
    if (!selectedStoryFeed) return;

    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < selectedStoryFeed.stories.length) {
      setCurrentStoryIndex(nextIndex);
      markStoryAsViewed(selectedStoryFeed.stories[nextIndex]);
      startStoryProgress();
    } else {
      // Move to next user's stories or close
      const currentFeedIndex = storiesFeed.findIndex(feed => feed.user.id === selectedStoryFeed.user.id);
      const nextFeedIndex = currentFeedIndex + 1;
      
      if (nextFeedIndex < storiesFeed.length) {
        openStoryViewer(storiesFeed[nextFeedIndex], 0);
      } else {
        closeStoryViewer();
      }
    }
  }

  /**
   * Navigate to previous story
   */
  function previousStory() {
    if (!selectedStoryFeed) return;

    const prevIndex = currentStoryIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStoryIndex(prevIndex);
      startStoryProgress();
    } else {
      // Move to previous user's stories or close
      const currentFeedIndex = storiesFeed.findIndex(feed => feed.user.id === selectedStoryFeed.user.id);
      const prevFeedIndex = currentFeedIndex - 1;
      
      if (prevFeedIndex >= 0) {
        const prevFeed = storiesFeed[prevFeedIndex];
        openStoryViewer(prevFeed, prevFeed.stories.length - 1);
      } else {
        closeStoryViewer();
      }
    }
  }

  /**
   * Mark story as viewed
   */
  async function markStoryAsViewed(story: StoryWithProfile) {
    try {
      if (!story.has_viewed) {
        await storiesService.viewStory(story.id);
        story.has_viewed = true;
      }
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  }

  /**
   * Open user stories
   */
  function openUserStories(userId: string) {
    const userFeed = storiesFeed.find(feed => feed.user.id === userId);
    if (userFeed) {
      openStoryViewer(userFeed, 0);
    }
  }

  /**
   * Render story item in horizontal list
   */
  function renderStoryItem({ item }: { item: StoryFeed }) {
    const hasUnviewed = item.hasUnviewed;
    
    return (
      <TouchableOpacity
        onPress={() => openStoryViewer(item)}
        className="items-center mr-4"
      >
        {/* Story Ring */}
        <View className={`w-16 h-16 rounded-full p-0.5 ${
          hasUnviewed ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-600'
        }`}>
          <View className="w-full h-full rounded-full bg-black p-0.5">
            {item.user.avatar_url ? (
              <Image
                source={{ uri: item.user.avatar_url }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full rounded-full bg-gray-700 items-center justify-center">
                <Text className="text-white text-lg font-bold">
                  {item.user.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Username */}
        <Text className="text-white text-xs mt-1 max-w-16" numberOfLines={1}>
          {item.user.username || 'User'}
        </Text>
      </TouchableOpacity>
    );
  }

  /**
   * Render story viewer modal
   */
  function renderStoryViewer() {
    if (!selectedStoryFeed || !isStoryViewVisible) return null;

    const currentStory = selectedStoryFeed.stories[currentStoryIndex];
    if (!currentStory) return null;

    return (
      <Modal
        visible={isStoryViewVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeStoryViewer}
      >
        <View className="flex-1 bg-black">
          {/* Story Progress Bars */}
          <View className="flex-row px-2 pt-12 pb-2">
            {selectedStoryFeed.stories.map((_, index) => (
              <View key={index} className="flex-1 h-1 bg-gray-600 mx-0.5 rounded">
                <View
                  className="h-full bg-white rounded"
                  style={{
                    width: index === currentStoryIndex 
                      ? `${storyProgress}%` 
                      : index < currentStoryIndex 
                        ? '100%' 
                        : '0%'
                  }}
                />
              </View>
            ))}
          </View>

          {/* Story Header */}
          <View className="flex-row items-center px-4 py-2">
            <Image
              source={{ uri: selectedStoryFeed.user.avatar_url || 'https://via.placeholder.com/40' }}
              className="w-8 h-8 rounded-full"
            />
            <Text className="text-white font-semibold ml-3">
              {selectedStoryFeed.user.username}
            </Text>
            <Text className="text-gray-400 text-sm ml-2">
              {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <TouchableOpacity
              onPress={closeStoryViewer}
              className="ml-auto p-2"
            >
              <Text className="text-white text-xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Story Content */}
          <View className="flex-1 relative">
            <Image
              source={{ uri: currentStory.media_url }}
              className="w-full h-full"
              resizeMode="contain"
            />

            {/* Navigation Areas */}
            <TouchableOpacity
              onPress={previousStory}
              className="absolute left-0 top-0 w-1/3 h-full"
              activeOpacity={1}
            />
            <TouchableOpacity
              onPress={nextStory}
              className="absolute right-0 top-0 w-1/3 h-full"
              activeOpacity={1}
            />

            {/* Caption */}
            {currentStory.caption && (
              <View className="absolute bottom-20 left-0 right-0 px-4">
                <Text className="text-white text-base bg-black/50 p-3 rounded-lg">
                  {currentStory.caption}
                </Text>
              </View>
            )}
          </View>

          {/* Story Actions */}
          <View className="flex-row items-center justify-between px-4 pb-8">
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-white mr-2">💬</Text>
              <Text className="text-white">Send Message</Text>
            </TouchableOpacity>
            
            <View className="flex-row space-x-4">
              <TouchableOpacity>
                <Text className="text-white text-2xl">♥</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-white text-2xl">📤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  /**
   * Render tab navigation buttons
   */
  function renderTabNavigation() {
    const tabs: { id: ContentTab; label: string; icon: string }[] = [
      { id: 'for-you', label: 'For You', icon: '✨' },
      { id: 'scores', label: 'Scores', icon: '⚡' },
      { id: 'highlights', label: 'Highlights', icon: '🎬' },
      { id: 'news', label: 'News', icon: '📰' },
    ];

    return (
      <View className="px-6 mb-6">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          <View className="flex-row space-x-2">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabChange(tab.id)}
                className={`flex-row items-center px-3 py-2 rounded-lg mr-2 ${
                  activeTab === tab.id 
                    ? 'bg-interactive' 
                    : 'bg-gray-800'
                }`}
              >
                <Text className="text-sm mr-1">{tab.icon}</Text>
                <Text 
                  className={`text-sm font-medium ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  /**
   * Render score content item
   */
  function renderScoreItem({ item }: { item: DiscoveryContent }) {
    if (item.type !== 'score' || !item.score) return null;

    const { score } = item;
    const isLive = score.status === 'live';

    return (
      <View className="bg-gray-800 rounded-xl mb-4 overflow-hidden">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pb-3">
          <View className="flex-row items-center">
            {/* League Badge */}
                          <View className="bg-interactive px-2 py-1 rounded mr-2">
              <Text className="text-white text-xs font-bold">
                {item.tags?.[0] || 'GAME'}
              </Text>
            </View>
            <Text className="text-white font-semibold">
              {item.title}
            </Text>
            {isLive && (
              <View className="bg-red-500 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-white text-xs font-bold">LIVE</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-400 text-sm">
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>

        {/* Score Display */}
        <View className="px-4 pb-4">
          <View className="bg-gray-700/50 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-semibold">
                {score.away_team}
              </Text>
              <Text className="text-white text-2xl font-bold">
                {score.away_score}
              </Text>
            </View>
            
            <View className="h-px bg-gray-600 my-2" />
            
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-semibold">
                {score.home_team}
              </Text>
              <Text className="text-white text-2xl font-bold">
                {score.home_score}
              </Text>
            </View>

            {isLive && score.quarter && score.time_remaining && (
              <View className="mt-3 pt-3 border-t border-gray-600">
                <Text className="text-gray-300 text-center">
                  {score.quarter} - {score.time_remaining}
                </Text>
              </View>
            )}

            {score.status === 'final' && (
              <View className="mt-3 pt-3 border-t border-gray-600">
                <Text className="text-gray-300 text-center font-semibold">
                  FINAL
                </Text>
              </View>
            )}
          </View>

          {item.description && (
            <Text className="text-gray-400 text-sm mt-3 text-center">
              {item.description}
            </Text>
          )}
        </View>

        {/* Engagement */}
        <View className="flex-row items-center justify-between p-4 pt-0">
          <View className="flex-row items-center space-x-6">
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'like')}
            >
              <Text className={`text-lg mr-1 ${item.engagement.liked ? 'text-red-500' : 'text-gray-400'}`}>
                {item.engagement.liked ? '❤️' : '🤍'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.likes)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'comment')}
            >
              <Text className="text-gray-400 text-lg mr-1">💬</Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.comments)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => handleContentInteraction(item.id, 'save')}>
            <Text className={`text-lg ${item.engagement.saved ? 'text-yellow-500' : 'text-gray-400'}`}>
              {item.engagement.saved ? '🔖' : '📋'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Render news article with expansion capability
   */
  function renderNewsArticle(item: DiscoveryContent) {
    const isExpanded = expandedArticles.has(item.id);
    
    return (
      <View className="bg-gray-900 rounded-xl mb-4 overflow-hidden border border-blue-600/20">
        {/* News indicator */}
                        <View className="bg-interactive px-3 py-1">
          <Text className="text-white text-xs font-bold text-center">
            📰 NEWS ARTICLE
          </Text>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: item.author.avatar_url || 'https://via.placeholder.com/40' }}
              className="w-8 h-8 rounded-full"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-sm">
                  {item.author.full_name}
                </Text>
                {item.author.verified && (
                  <Text className="text-interactive ml-1">✓</Text>
                )}
                {item.team && (
                  <View 
                    className="ml-2 px-2 py-0.5 rounded"
                    style={{ backgroundColor: item.team.primary_color + '20' }}
                  >
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: item.team.primary_color }}
                    >
                      {item.team.name}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-400 text-xs">
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>

          {/* Feedback buttons at the top */}
          <View className="flex-row items-center justify-between mb-3 p-2 bg-gray-800 rounded-lg">
            <Text className="text-gray-300 text-sm">Find this article interesting?</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity 
                onPress={() => handleNewsFeedback(item.id, 'helpful')}
                className={`px-3 py-1 rounded-lg ${item.userFeedback === 'helpful' ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <Text className={`text-sm ${item.userFeedback === 'helpful' ? 'text-white' : 'text-green-400'}`}>
                  👍
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleNewsFeedback(item.id, 'not-relevant')}
                className={`px-3 py-1 rounded-lg ${item.userFeedback === 'not-relevant' ? 'bg-red-600' : 'bg-gray-700'}`}
              >
                <Text className={`text-sm ${item.userFeedback === 'not-relevant' ? 'text-white' : 'text-red-400'}`}>
                  👎
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text className="text-white font-semibold text-lg mb-2">
            {item.title}
          </Text>

          {/* Content - expandable */}
          <View className="mb-3">
            <Text className="text-gray-300 text-sm leading-relaxed">
              {isExpanded ? item.fullContent : (item.summary || item.description)}
            </Text>
            
            {/* Expansion toggle */}
            <TouchableOpacity 
              onPress={() => toggleArticleExpansion(item.id)}
              className="mt-2 py-2"
            >
              <Text className="text-blue-400 text-sm font-medium">
                {isExpanded ? '📖 Show less' : '📖 Read full article'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Source attribution */}
          {item.sourceAttribution && (
            <View className="p-2 bg-black/20 rounded-lg mb-3">
              <Text className="text-blue-400 text-xs">
                📰 Source: {item.sourceAttribution}
              </Text>
              {item.source_url && (
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Open source URL in browser
                    console.log('Open source URL:', item.source_url);
                  }}
                >
                  <Text className="text-blue-300 text-xs mt-1 underline">
                    View original article
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <View className="flex-row flex-wrap mb-3">
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} className="bg-gray-800 px-2 py-1 rounded mr-2 mb-1">
                  <Text className="text-gray-400 text-xs">#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Engagement actions */}
        <View className="flex-row items-center justify-between p-4 pt-0 border-t border-gray-800">
          <View className="flex-row items-center space-x-6">
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'like')}
            >
              <Text className={`text-lg mr-1 ${item.engagement.liked ? 'text-red-500' : 'text-gray-400'}`}>
                {item.engagement.liked ? '❤️' : '🤍'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.likes)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'comment')}
            >
              <Text className="text-gray-400 text-lg mr-1">💬</Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.comments)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'share')}
            >
              <Text className="text-gray-400 text-lg mr-1">📤</Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.shares)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => handleContentInteraction(item.id, 'save')}>
            <Text className={`text-lg ${item.engagement.saved ? 'text-yellow-500' : 'text-gray-400'}`}>
              {item.engagement.saved ? '🔖' : '📋'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Render discovery content item
   */
  function renderDiscoveryItem({ item }: { item: DiscoveryContent }) {
    // Special rendering for news articles in the news tab
    if (activeTab === 'news' && item.type === 'news') {
      return renderNewsArticle(item);
    }

    // Special rendering for AI-generated content (Phase 3A Week 2)
    if (item.aiGenerated) {
      return (
        <View className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl mb-4 overflow-hidden border border-blue-600/30">
          {/* AI Badge */}
          <View className="flex-row items-center justify-between p-3 pb-2">
            <View className="flex-row items-center">
              <View className="bg-interactive px-2 py-1 rounded-full mr-2">
                <Text className="text-white text-xs font-bold">🤖 AI GENERATED</Text>
              </View>
              {item.cached && (
                <View className="bg-green-500 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs">⚡ CACHED</Text>
                </View>
              )}
            </View>
            <Text className="text-blue-300 text-xs">
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          {/* Content */}
          <View className="px-4 pb-4">
            <Text className="text-white font-semibold text-lg mb-2">
              {item.title}
            </Text>
            <Text className="text-gray-300 text-sm leading-relaxed mb-3">
              {item.description}
            </Text>
            
            {/* Source Attribution */}
            {item.sourceAttribution && (
              <View className="p-2 bg-black/20 rounded-lg mb-3">
                <Text className="text-blue-400 text-xs">
                  📰 Sources: {item.sourceAttribution}
                </Text>
                {item.relevanceScore && (
                  <Text className="text-gray-500 text-xs mt-1">
                    Relevance: {Math.round(item.relevanceScore * 100)}%
                  </Text>
                )}
              </View>
            )}
            
            {/* Feedback Buttons */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row space-x-4">
                <TouchableOpacity 
                  onPress={() => handleRAGFeedback(item.id, 'helpful')}
                  className={`px-3 py-2 rounded-lg ${item.userFeedback === 'helpful' ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <Text className={`text-sm ${item.userFeedback === 'helpful' ? 'text-white' : 'text-green-400'}`}>
                    👍 Helpful
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleRAGFeedback(item.id, 'not-relevant')}
                  className={`px-3 py-2 rounded-lg ${item.userFeedback === 'not-relevant' ? 'bg-red-600' : 'bg-gray-700'}`}
                >
                  <Text className={`text-sm ${item.userFeedback === 'not-relevant' ? 'text-white' : 'text-red-400'}`}>
                    👎 Not relevant
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Standard engagement buttons */}
              <View className="flex-row items-center space-x-4">
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => handleContentInteraction(item.id, 'like')}
                >
                  <Text className={`text-lg mr-1 ${item.engagement.liked ? 'text-red-500' : 'text-gray-400'}`}>
                    {item.engagement.liked ? '❤️' : '🤍'}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {formatNumber(item.stats.likes)}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleContentInteraction(item.id, 'save')}>
                  <Text className={`text-lg ${item.engagement.saved ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {item.engagement.saved ? '🔖' : '📋'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // Standard content rendering
    return (
      <View className="bg-gray-900 rounded-xl mb-4 overflow-hidden">
        {/* Live indicator */}
        {item.isLive && (
          <View className="bg-red-600 px-3 py-1">
            <Text className="text-white text-xs font-bold text-center">
              🔴 LIVE
            </Text>
          </View>
        )}

        {/* Media */}
        {item.media_url && (
          <View className="relative">
            <Image
              source={{ uri: item.thumbnail_url || item.media_url }}
              className="w-full h-48"
              resizeMode="cover"
            />
            {/* Video duration indicator for highlights */}
            {item.type === 'highlight' && item.duration && (
              <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-xs font-medium">
                  {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}
            {/* Play button overlay for video content */}
            {item.type === 'highlight' && (
              <View className="absolute inset-0 items-center justify-center">
                <View className="bg-black/50 rounded-full p-3">
                  <Text className="text-white text-2xl">▶️</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: item.author.avatar_url || 'https://via.placeholder.com/40' }}
              className="w-8 h-8 rounded-full"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-sm">
                  {item.author.full_name}
                </Text>
                {item.author.verified && (
                  <Text className="text-interactive ml-1">✓</Text>
                )}
                {item.team && (
                  <View 
                    className="ml-2 px-2 py-0.5 rounded"
                    style={{ backgroundColor: item.team.primary_color + '20' }}
                  >
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: item.team.primary_color }}
                    >
                      {item.team.name}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-400 text-xs">
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>

          {/* Title and description */}
          <Text className="text-white font-semibold text-lg mb-2">
            {item.title}
          </Text>
          {item.description && (
            <Text className="text-gray-300 text-sm mb-3 leading-relaxed">
              {item.description}
            </Text>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <View className="flex-row flex-wrap mb-3">
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} className="bg-gray-800 px-2 py-1 rounded mr-2 mb-1">
                  <Text className="text-gray-400 text-xs">#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Engagement actions */}
        <View className="flex-row items-center justify-between p-4 pt-3">
          <View className="flex-row items-center space-x-6">
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'like')}
            >
              <Text className={`text-lg mr-1 ${item.engagement.liked ? 'text-red-500' : 'text-gray-400'}`}>
                {item.engagement.liked ? '❤️' : '🤍'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.likes)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'comment')}
            >
              <Text className="text-gray-400 text-lg mr-1">💬</Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.comments)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => handleContentInteraction(item.id, 'share')}
            >
              <Text className="text-gray-400 text-lg mr-1">📤</Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(item.stats.shares)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => handleContentInteraction(item.id, 'save')}>
            <Text className={`text-lg ${item.engagement.saved ? 'text-yellow-500' : 'text-gray-400'}`}>
              {item.engagement.saved ? '🔖' : '📋'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Render trending topic chip
   */
  function renderTrendingTopic(topic: string, index: number) {
    return (
      <TouchableOpacity
        key={index}
        className="bg-interactive/20 px-4 py-2 rounded-full mr-3"
        onPress={() => setSearchQuery(topic.replace('#', ''))}
      >
        <Text className="text-interactive font-medium">
          {topic}
        </Text>
      </TouchableOpacity>
    );
  }

  /**
   * Render team card
   */
  function renderTeamCard(team: Team) {
    return (
      <TouchableOpacity
        key={team.id}
        className="bg-gray-800 rounded-xl p-4 mr-4 min-w-48"
        onPress={() => navigation.navigate('TeamProfile', { teamId: team.id })}
      >
        <View className="flex-row items-center mb-3">
          <View 
            className="w-8 h-8 rounded-full mr-3"
            style={{ backgroundColor: team.primary_color }}
          />
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">
              {team.name}
            </Text>
            <Text className="text-gray-400 text-xs">
              {team.league}
            </Text>
          </View>
        </View>
        
        <Text className="text-gray-300 text-xs mb-3">
          Latest team updates and fan activity
        </Text>
        
        <Button
          title="View Team"
          onPress={() => navigation.navigate('TeamProfile', { teamId: team.id })}
          variant="outline"
          size="sm"
        />
      </TouchableOpacity>
    );
  }

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading your personalized feed...</Text>
          <Text className="text-gray-400 text-sm mt-2">
            Curating sports content just for you
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0066FF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Discover
            </Text>
            <Text className="text-gray-400">
              Personalized sports content for you
            </Text>
          </View>
          
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center ml-4"
            onPress={() => setShowSearch(!showSearch)}
          >
            <Text className="text-white text-lg">🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="px-6 mb-4">
            <TextInput
              className="bg-gray-800 text-white px-4 py-3 rounded-xl"
              placeholder="Search sports content, teams, or players..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        {/* Stories Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-white text-lg font-semibold">
              Stories
            </Text>
            {storiesFeed.length > 0 && (
              <Text className="text-interactive text-sm">
                {storiesFeed.filter(s => s.hasUnviewed).length} new
              </Text>
            )}
          </View>
          
          {storiesFeed.length > 0 ? (
            <FlatList
              data={storiesFeed}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.user.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          ) : (
            <View className="px-6">
              <View className="bg-gray-800/50 rounded-xl p-6 items-center">
                <Text className="text-3xl mb-2">📱</Text>
                <Text className="text-white font-semibold mb-1">
                  No Stories Yet
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  Follow other sports fans to see their stories here
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Tab Content */}
        <View className="px-4">
          {/* Tab Header */}
          <View className="mb-4 px-2">
            <Text className="text-white text-lg font-semibold">
              {activeTab === 'for-you' && 'For You'}
              {activeTab === 'scores' && 'Live Scores & Standings'}
              {activeTab === 'highlights' && 'Video Highlights'}
              {activeTab === 'news' && 'Latest Sports News'}
            </Text>
            <Text className="text-gray-400 text-sm">
              {activeTab === 'for-you' && 'AI-curated content and insider information'}
              {activeTab === 'scores' && 'Live scores from your selected leagues'}
              {activeTab === 'highlights' && 'Best moments and key plays'}
              {activeTab === 'news' && 'Breaking news and updates'}
            </Text>
          </View>
          
          {/* Content Feed */}
          <FlatList
            data={getCurrentTabContent()}
            renderItem={({ item }) => {
              // Use appropriate render function based on content type
              if (item.type === 'score') {
                return renderScoreItem({ item });
              }
              return renderDiscoveryItem({ item });
            }}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="bg-gray-800/50 rounded-xl p-6 items-center">
                <Text className="text-3xl mb-2">
                  {activeTab === 'for-you' && '✨'}
                  {activeTab === 'scores' && '⚡'}
                  {activeTab === 'highlights' && '🎬'}
                  {activeTab === 'news' && '📰'}
                </Text>
                <Text className="text-white font-semibold mb-1">
                  No {activeTab === 'for-you' ? 'personalized' : activeTab} content yet
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  {activeTab === 'for-you' && 'Follow teams and players to see personalized content'}
                  {activeTab === 'scores' && 'No games found for your selected leagues today. Check back during the sports season for live scores and updates.'}
                  {activeTab === 'highlights' && 'No video highlights available from the last 24 hours. Real highlights from your favorite teams will appear here when available.'}
                  {activeTab === 'news' && 'Latest sports news will appear here'}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Load More / Refresh Button */}
        <View className="px-6 py-4 mb-8">
          <Button
            title={
              activeTab === 'scores' ? 'Refresh Scores' :
              activeTab === 'for-you' ? 'Refresh Content' :
              'Load More Content'
            }
            onPress={() => {
              if (activeTab === 'scores') {
                scoresService.clearCache();
                loadScoresContent();
              } else if (activeTab === 'for-you') {
                loadForYouContent();
              } else {
                console.log('Load more content for', activeTab);
              }
            }}
            variant="outline"
          />
        </View>
      </ScrollView>

      {/* Story Viewer Modal */}
      {renderStoryViewer()}
    </SafeAreaView>
  );
} 