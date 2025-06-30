/**
 * News Service - Individual Article Fetching
 * 
 * This service fetches individual news articles directly from multiple sources
 * for display in the News tab. Unlike the RAG service which creates summaries,
 * this service returns standalone articles that can be expanded and read individually.
 * 
 * Features:
 * - Direct API integration with news sources
 * - Individual article processing and formatting
 * - Content deduplication without summarization
 * - Personalized ranking based on user preferences
 */

import { supabase } from '../database/supabase';

// Environment check for API keys
import Constants from 'expo-constants';

const NEWSAPI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_NEWSAPI_API_KEY || 
                      process.env.EXPO_PUBLIC_NEWSAPI_API_KEY;

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  source_url: string;
  source_name: string;
  author?: string;
  published_at: string;
  media_url?: string;
  thumbnail_url?: string;
  tags: string[];
  teams?: string[];
  content_type: 'news';
  engagement_score?: number;
}

export interface NewsServiceOptions {
  maxArticles?: number;
  sources?: ('newsapi' | 'reddit' | 'youtube')[];
  teamFilter?: string[];
  forceRefresh?: boolean;
}

class NewsService {
  private cache: Map<string, { articles: NewsArticle[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Fetch individual news articles for the News tab
   */
  async getIndividualNewsArticles(
    userId: string, 
    options: NewsServiceOptions = {}
  ): Promise<NewsArticle[]> {
    const cacheKey = `news_${userId}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (!options.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📦 Returning cached news articles');
        return cached.articles;
      }
    }

    try {
      console.log('🗞️ Fetching fresh individual news articles...');
      
      // Get user's favorite teams for personalization
      const favoriteTeams = await this.getUserFavoriteTeams(userId);
      
      // Fetch from multiple sources in parallel
      const [newsApiArticles, redditArticles] = await Promise.all([
        this.fetchNewsAPIArticles(favoriteTeams, options.maxArticles || 15),
        this.fetchRedditArticles(favoriteTeams, 5),
        // Note: YouTube would need different handling for video content
      ]);

      // Combine and deduplicate articles
      const allArticles = [...newsApiArticles, ...redditArticles];
      const deduplicatedArticles = this.deduplicateArticles(allArticles);
      
      // Personalize ranking based on user preferences
      const rankedArticles = this.rankArticlesByPreference(
        deduplicatedArticles, 
        favoriteTeams
      );

      // Limit final results
      const finalArticles = rankedArticles.slice(0, options.maxArticles || 10);

      // Cache the results
      this.cache.set(cacheKey, {
        articles: finalArticles,
        timestamp: Date.now()
      });

      console.log(`✅ Fetched ${finalArticles.length} individual news articles`);
      return finalArticles;

    } catch (error) {
      console.error('❌ Failed to fetch news articles:', error);
      return [];
    }
  }

  /**
   * Fetch articles from NewsAPI
   */
  private async fetchNewsAPIArticles(
    favoriteTeams: string[], 
    maxArticles: number = 15
  ): Promise<NewsArticle[]> {
    if (!NEWSAPI_API_KEY) {
      console.warn('NewsAPI key not available');
      return [];
    }

    try {
      // Build query with team names and general sports terms
      const teamQuery = favoriteTeams.length > 0 
        ? favoriteTeams.join(' OR ') 
        : '';
      const sportsQuery = 'NFL OR NBA OR MLB OR NHL OR soccer OR basketball OR football OR baseball OR hockey';
      const query = teamQuery ? `${teamQuery} OR ${sportsQuery}` : sportsQuery;

      // Fetch recent articles (last week)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const url = `https://newsapi.org/v2/everything?` +
        `q=${encodeURIComponent(query)}&` +
        `domains=bleacherreport.com,espn.com,si.com,nfl.com,nba.com,cbssports.com&` +
        `sortBy=publishedAt&` +
        `from=${oneWeekAgo}&` +
        `pageSize=${maxArticles}&` +
        `apiKey=${NEWSAPI_API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.articles || [])
        .filter((article: any) => 
          article.title && 
          article.description && 
          article.publishedAt &&
          !article.title.toLowerCase().includes('[removed]')
        )
        .map((article: any, index: number): NewsArticle => ({
          id: `newsapi_${article.publishedAt}_${index}`,
          title: article.title,
          summary: article.description || '',
          fullContent: article.content || article.description || '',
          source_url: article.url,
          source_name: this.extractSourceName(article.source?.name || article.url),
          author: article.author,
          published_at: article.publishedAt,
          media_url: article.urlToImage,
          thumbnail_url: article.urlToImage,
          tags: this.extractTagsFromContent(article.title + ' ' + article.description),
          teams: this.extractTeamsFromContent(article.title + ' ' + article.description, favoriteTeams),
          content_type: 'news' as const,
          engagement_score: this.calculateEngagementScore(article, favoriteTeams)
        }));

    } catch (error) {
      console.error('Error fetching NewsAPI articles:', error);
      return [];
    }
  }

  /**
   * Fetch articles from Reddit sports communities
   */
  private async fetchRedditArticles(
    favoriteTeams: string[], 
    maxArticles: number = 5
  ): Promise<NewsArticle[]> {
    try {
      // Reddit RSS feeds for major sports subreddits
      const subreddits = ['nfl', 'nba', 'baseball', 'hockey', 'soccer'];
      const articles: NewsArticle[] = [];

      for (const subreddit of subreddits.slice(0, 2)) { // Limit to avoid rate limiting
        try {
          const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`);
          if (!response.ok) continue;

          const data = await response.json();
          const posts = data.data?.children || [];

          for (const post of posts.slice(0, 3)) { // Limit posts per subreddit
            const postData = post.data;
            
            // Skip if it's not a news-like post
            if (!postData.title || postData.is_self || !postData.url) continue;
            
            articles.push({
              id: `reddit_${postData.id}`,
              title: postData.title,
              summary: postData.selftext?.substring(0, 300) || `Discussion from r/${subreddit}`,
              fullContent: postData.selftext || `Original discussion: ${postData.url}`,
              source_url: `https://reddit.com${postData.permalink}`,
              source_name: `r/${subreddit}`,
              author: postData.author,
              published_at: new Date(postData.created_utc * 1000).toISOString(),
              media_url: postData.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&'),
              thumbnail_url: postData.thumbnail !== 'default' ? postData.thumbnail : undefined,
              tags: [subreddit, 'discussion', 'community'],
              teams: this.extractTeamsFromContent(postData.title, favoriteTeams),
              content_type: 'news' as const,
              engagement_score: this.calculateRedditEngagement(postData, favoriteTeams)
            });
          }
        } catch (subredditError) {
          console.warn(`Error fetching from r/${subreddit}:`, subredditError);
        }
      }

      return articles;

    } catch (error) {
      console.error('Error fetching Reddit articles:', error);
      return [];
    }
  }

  /**
   * Get user's favorite teams for personalization
   */
  private async getUserFavoriteTeams(userId: string): Promise<string[]> {
    try {
      const { data: profile } = await supabase
        .from('user_personalization_profiles')
        .select('favorite_teams')
        .eq('user_id', userId)
        .single();

      return profile?.favorite_teams || [];
    } catch (error) {
      console.warn('Could not fetch user favorite teams:', error);
      return [];
    }
  }

  /**
   * Remove duplicate articles based on title similarity
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const unique: NewsArticle[] = [];
    const seen = new Set<string>();

    for (const article of articles) {
      // Create a normalized version of the title for comparison
      const normalizedTitle = article.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Check for similar titles (simple approach)
      const isDuplicate = Array.from(seen).some(seenTitle => 
        this.calculateSimilarity(normalizedTitle, seenTitle) > 0.8
      );

      if (!isDuplicate) {
        seen.add(normalizedTitle);
        unique.push(article);
      }
    }

    return unique;
  }

  /**
   * Rank articles by user preference and engagement
   */
  private rankArticlesByPreference(
    articles: NewsArticle[], 
    favoriteTeams: string[]
  ): NewsArticle[] {
    return articles.sort((a, b) => {
      // Prioritize articles about favorite teams
      const aHasFavTeam = a.teams?.some(team => 
        favoriteTeams.some(favTeam => 
          team.toLowerCase().includes(favTeam.toLowerCase())
        )
      ) ? 1 : 0;
      
      const bHasFavTeam = b.teams?.some(team => 
        favoriteTeams.some(favTeam => 
          team.toLowerCase().includes(favTeam.toLowerCase())
        )
      ) ? 1 : 0;

      if (aHasFavTeam !== bHasFavTeam) {
        return bHasFavTeam - aHasFavTeam;
      }

      // Secondary sort by engagement score
      return (b.engagement_score || 0) - (a.engagement_score || 0);
    });
  }

  /**
   * Extract potential team names from content
   */
  private extractTeamsFromContent(content: string, favoriteTeams: string[]): string[] {
    const commonTeams = [
      'Cowboys', 'Giants', 'Eagles', 'Commanders',
      'Patriots', 'Bills', 'Dolphins', 'Jets',
      'Steelers', 'Ravens', 'Browns', 'Bengals',
      'Titans', 'Colts', 'Texans', 'Jaguars',
      'Chiefs', 'Chargers', 'Raiders', 'Broncos',
      'Lakers', 'Warriors', 'Celtics', 'Heat',
      'Yankees', 'Red Sox', 'Dodgers', 'Giants',
    ];

    const foundTeams: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for favorite teams first
    for (const team of favoriteTeams) {
      if (lowerContent.includes(team.toLowerCase())) {
        foundTeams.push(team);
      }
    }

    // Check for common teams
    for (const team of commonTeams) {
      if (lowerContent.includes(team.toLowerCase()) && !foundTeams.includes(team)) {
        foundTeams.push(team);
      }
    }

    return foundTeams;
  }

  /**
   * Extract relevant tags from content
   */
  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = ['Sports', 'News'];
    const lowerContent = content.toLowerCase();

    const sportKeywords = {
      'NFL': ['nfl', 'football', 'quarterback', 'touchdown'],
      'NBA': ['nba', 'basketball', 'playoff', 'championship'],
      'MLB': ['mlb', 'baseball', 'world series', 'pitcher'],
      'NHL': ['nhl', 'hockey', 'stanley cup', 'goal'],
      'Soccer': ['soccer', 'football', 'world cup', 'mls']
    };

    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        tags.push(sport);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate engagement score for ranking
   */
  private calculateEngagementScore(article: any, favoriteTeams: string[]): number {
    let score = 0;

    // Recency boost (newer articles score higher)
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 24 - hoursAgo) / 24; // 0-1 based on recency

    // Favorite team boost
    if (this.extractTeamsFromContent(article.title + ' ' + article.description, favoriteTeams).length > 0) {
      score += 0.5;
    }

    // Source reliability boost
    const reliableSources = ['espn.com', 'nfl.com', 'nba.com', 'bleacherreport.com'];
    if (reliableSources.some(source => article.url?.includes(source))) {
      score += 0.3;
    }

    return score;
  }

  /**
   * Calculate engagement score for Reddit posts
   */
  private calculateRedditEngagement(postData: any, favoriteTeams: string[]): number {
    let score = 0;

    // Upvote ratio
    score += (postData.upvote_ratio || 0.5) * 0.3;

    // Comment engagement
    score += Math.min((postData.num_comments || 0) / 100, 0.3);

    // Favorite team boost
    if (this.extractTeamsFromContent(postData.title, favoriteTeams).length > 0) {
      score += 0.5;
    }

    return score;
  }

  /**
   * Extract clean source name from URL or source object
   */
  private extractSourceName(sourceInput: string): string {
    if (!sourceInput) return 'Sports News';
    
    // If it's already a clean source name
    if (!sourceInput.includes('.')) return sourceInput;
    
    // Extract from URL
    try {
      const url = new URL(sourceInput.startsWith('http') ? sourceInput : `https://${sourceInput}`);
      const domain = url.hostname.replace('www.', '');
      
      const sourceMap: Record<string, string> = {
        'espn.com': 'ESPN',
        'bleacherreport.com': 'Bleacher Report',
        'si.com': 'Sports Illustrated',
        'nfl.com': 'NFL.com',
        'nba.com': 'NBA.com',
        'cbssports.com': 'CBS Sports',
        'reddit.com': 'Reddit'
      };
      
      return sourceMap[domain] || domain.split('.')[0];
    } catch {
      return sourceInput;
    }
  }

  /**
   * Simple string similarity calculation
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}

export const newsService = new NewsService();

/**
 * Main function to get individual news articles for the News tab
 */
export async function getIndividualNewsArticles(
  userId: string,
  options: NewsServiceOptions = {}
): Promise<NewsArticle[]> {
  return newsService.getIndividualNewsArticles(userId, options);
} 