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
import { Database } from '../../types/database';

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
      // TODO: Implement AI-powered content recommendation service
      // For now, create mock personalized content
      createMockForYouContent();
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
      // TODO: Implement live scores API integration
      createMockScoresContent();
    } catch (error) {
      console.error('❌ Failed to load Scores content:', error);
      createMockScoresContent();
    }
  }

  /**
   * Load highlights and video content
   */
  async function loadHighlightsContent() {
    try {
      // TODO: Implement highlights API integration
      createMockHighlightsContent();
    } catch (error) {
      console.error('❌ Failed to load Highlights content:', error);
      createMockHighlightsContent();
    }
  }

  /**
   * Load latest news content
   */
  async function loadNewsContent() {
    try {
      // TODO: Implement news API integration
      createMockNewsContent();
    } catch (error) {
      console.error('❌ Failed to load News content:', error);
      createMockNewsContent();
    }
  }

  /**
   * Create mock "For You" feed with personalized and insider content
   */
  function createMockForYouContent() {
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
  function createMockHighlightsContent() {
    const mockContent: DiscoveryContent[] = [
      {
        id: 'highlight-1',
        type: 'highlight',
        title: 'Incredible touchdown pass in overtime!',
        description: 'Watch this amazing 40-yard touchdown that sealed the victory',
        media_url: 'https://via.placeholder.com/400x300/1E40AF/ffffff?text=Touchdown+Highlight',
        thumbnail_url: 'https://via.placeholder.com/400x300/1E40AF/ffffff?text=Touchdown+Highlight',
        author: {
          id: 'nfl-official',
          username: 'nfl_highlights',
          full_name: 'NFL Official',
          avatar_url: 'https://via.placeholder.com/100x100/1E40AF/ffffff?text=NFL',
          verified: true,
        },
        team: {
          id: 'team-1',
          name: 'Dallas Cowboys',
          primary_color: '#003594',
        },
        stats: {
          likes: 15420,
          comments: 892,
          shares: 2341,
          views: 156000,
        },
        engagement: {
          liked: false,
          saved: false,
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ['NFL', 'Cowboys', 'Touchdown', 'Highlight'],
        duration: 45,
      },
      {
        id: 'highlight-2',
        type: 'highlight',
        title: 'LeBron\'s clutch three-pointer',
        description: 'The King delivers in the final seconds to secure the win',
        media_url: 'https://via.placeholder.com/400x300/552583/ffffff?text=Clutch+Shot',
        author: {
          id: 'nba-highlights',
          username: 'nba_highlights',
          full_name: 'NBA Highlights',
          verified: true,
        },
        stats: {
          likes: 12890,
          comments: 645,
          shares: 1890,
          views: 98400,
        },
        engagement: {
          liked: true,
          saved: true,
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        tags: ['NBA', 'Lakers', 'LeBron', 'Clutch'],
        duration: 30,
      },
    ];

    setHighlightsFeed(mockContent);
    console.log('✅ Mock Highlights feed created:', mockContent.length, 'items');
  }

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
        media_url: 'https://via.placeholder.com/400x300/EF4444/ffffff?text=Trade+News',
        author: {
          id: 'sports-news',
          username: 'sports_news',
          full_name: 'Sports News Central',
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
      },
      {
        id: 'news-2',
        type: 'news',
        title: 'Injury update: Star player expected to return',
        description: 'Medical team optimistic about recovery timeline for playoff push',
        media_url: 'https://via.placeholder.com/400x300/10B981/ffffff?text=Injury+Update',
        author: {
          id: 'medical-reporter',
          username: 'injury_insider',
          full_name: 'Medical Sports Reporter',
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
          <View className="w-full h-full rounded-full bg-slate-900 p-0.5">
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
                    ? 'bg-blue-600' 
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
   * Render discovery content item
   */
  function renderDiscoveryItem({ item }: { item: DiscoveryContent }) {
    return (
      <View className="bg-gray-800 rounded-xl mb-4 overflow-hidden">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pb-3">
          <TouchableOpacity 
            className="flex-row items-center flex-1"
            onPress={() => navigation.navigate('UserProfile', { userId: item.author.id })}
          >
            {item.author.avatar_url ? (
              <Image
                source={{ uri: item.author.avatar_url }}
                className="w-10 h-10 rounded-full mr-3"
                resizeMode="cover"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-600 mr-3 items-center justify-center">
                <Text className="text-white font-bold">
                  {item.author.username[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold">
                  {item.author.full_name}
                </Text>
                {item.author.verified && (
                  <Text className="text-blue-500 ml-1">✓</Text>
                )}
                {item.isLive && (
                  <View className="bg-red-500 px-2 py-0.5 rounded-full ml-2">
                    <Text className="text-white text-xs font-bold">LIVE</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-400 text-sm">
                @{item.author.username} • {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity>
            <Text className="text-gray-400 text-lg">⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="px-4 pb-3">
          <Text className="text-white font-semibold text-base mb-1">
            {item.title}
          </Text>
          {item.description && (
            <Text className="text-gray-300 text-sm mb-3">
              {item.description}
            </Text>
          )}
          
          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row">
              {item.tags.slice(0, 4).map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-blue-600/20 px-3 py-1 rounded-full mr-2"
                >
                  <Text className="text-blue-400 text-xs font-medium">
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Media */}
        {item.media_url && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ContentDetails', { contentId: item.id })}
          >
            <Image
              source={{ uri: item.media_url }}
              style={{ width: screenWidth - 32, height: 200 }}
              className="mx-4 rounded-lg"
              resizeMode="cover"
            />
            {item.duration && (
              <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-xs">
                  {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Engagement */}
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
        className="bg-blue-600/20 px-4 py-2 rounded-full mr-3"
        onPress={() => setSearchQuery(topic.replace('#', ''))}
      >
        <Text className="text-blue-400 font-medium">
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
      <SafeAreaView className="flex-1 bg-slate-900">
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
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
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
              <Text className="text-blue-500 text-sm">
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
              {activeTab === 'scores' && 'Real-time scores for your favorite teams'}
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
                  {activeTab === 'scores' && 'Add favorite teams to see their scores'}
                  {activeTab === 'highlights' && 'Check back later for video highlights'}
                  {activeTab === 'news' && 'Latest sports news will appear here'}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Load More Button */}
        <View className="px-6 py-4 mb-8">
          <Button
            title="Load More Content"
            onPress={() => {
              // TODO: Implement pagination
              console.log('Load more content');
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