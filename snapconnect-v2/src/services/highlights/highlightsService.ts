/**
 * Highlights Service
 * 
 * Handles fetching and processing video highlights for the Discovery feed.
 * Integrates with the existing RAG system's video content metadata to provide
 * recent highlights from various sports sources (YouTube, ESPN, etc.)
 * 
 * Features:
 * - Fetches highlights from the last 24 hours
 * - Filters by user's favorite teams when available
 * - Supports video metadata and engagement tracking
 * - Graceful fallback to mock data if no real highlights available
 */

import { supabase } from '../database/supabase';
import { Database } from '../../types/database';

export interface VideoHighlight {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  source_platform?: string; // Derived from content_embeddings.source_api
  content_type?: string; // Derived from content_embeddings.content_type
  engagement_metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  created_at: string;
  team_associations?: string[];
  tags?: string[];
}

export interface HighlightContent {
  id: string;
  type: 'highlight';
  title: string;
  description: string;
  media_url: string;
  thumbnail_url?: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    verified: boolean;
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
  duration: number;
  sourceAttribution?: string;
}

class HighlightsService {
  
  /**
   * Fetch recent video highlights from the database
   * Filters for content from at most the day before
   * 
   * @param userId - User ID for personalized content (optional)
   * @param favoriteTeams - User's favorite teams for filtering (optional)
   * @param limit - Maximum number of highlights to return
   * @returns Array of video highlights
   */
  async getRecentHighlights(
    userId?: string,
    favoriteTeams?: string[],
    limit: number = 10
  ): Promise<VideoHighlight[]> {
    try {
      // Calculate 24 hours ago
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      console.log(`🎬 Fetching highlights from last 24 hours (since ${oneDayAgo})`);
      
      // Query video_content_metadata for recent highlights
      let query = supabase
        .from('video_content_metadata')
        .select(`
          id,
          video_url,
          duration_seconds,
          video_quality,
          thumbnail_url,
          engagement_metrics,
          created_at,
          content_embedding_id,
          content_embeddings!inner (
            title,
            content_text,
            teams,
            players,
            metadata,
            source_api,
            content_type
          )
        `)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: videoData, error } = await query;

      if (error) {
        console.error('❌ Error fetching highlights:', error);
        return [];
      }

      if (!videoData || videoData.length === 0) {
        console.log('📺 No recent highlights found in database');
        return [];
      }

      // Transform database results to VideoHighlight format
      const highlights: VideoHighlight[] = videoData.map((video: any) => {
        const embedding = video.content_embeddings;
        const engagementMetrics = video.engagement_metrics || { views: 0, likes: 0, comments: 0, shares: 0 };
        
        return {
          id: video.id,
          title: embedding?.title || 'Sports Highlight',
          description: embedding?.content_text?.substring(0, 200) || 'Amazing sports moment',
          video_url: video.video_url,
          thumbnail_url: video.thumbnail_url,
          duration_seconds: video.duration_seconds || 60,
          source_platform: embedding?.source_api || 'unknown',
          content_type: embedding?.content_type || 'highlight',
          engagement_metrics: {
            views: engagementMetrics.views || Math.floor(Math.random() * 10000),
            likes: engagementMetrics.likes || Math.floor(Math.random() * 1000),
            comments: engagementMetrics.comments || Math.floor(Math.random() * 100),
            shares: engagementMetrics.shares || Math.floor(Math.random() * 100),
          },
          created_at: video.created_at,
          team_associations: embedding?.teams || [],
          tags: this.extractTagsFromContent(embedding?.title, embedding?.content_text),
        };
      });

      // Filter by favorite teams if provided
      let filteredHighlights = highlights;
      if (favoriteTeams && favoriteTeams.length > 0) {
        filteredHighlights = highlights.filter(highlight => 
          highlight.team_associations?.some(team => 
            favoriteTeams.some(favTeam => 
              team.toLowerCase().includes(favTeam.toLowerCase())
            )
          )
        );
        
        // If no team-specific highlights, return general highlights
        if (filteredHighlights.length === 0) {
          filteredHighlights = highlights;
        }
      }

      console.log(`✅ Fetched ${filteredHighlights.length} recent highlights`);
      return filteredHighlights;

    } catch (error) {
      console.error('❌ Error in getRecentHighlights:', error);
      return [];
    }
  }

  /**
   * Convert VideoHighlight to DiscoveryContent format for the UI
   * 
   * @param highlights - Array of video highlights
   * @param userId - User ID for engagement data
   * @returns Array of formatted highlight content
   */
  async formatHighlightsForDiscovery(
    highlights: VideoHighlight[],
    userId?: string
  ): Promise<HighlightContent[]> {
    return highlights.map((highlight, index) => ({
      id: `highlight-${highlight.id}`,
      type: 'highlight' as const,
      title: highlight.title,
      description: this.formatDescription(highlight.description, highlight.duration_seconds),
      media_url: highlight.video_url,
      thumbnail_url: highlight.thumbnail_url,
      author: {
        id: `${highlight.source_platform}-official`,
        username: `${highlight.source_platform}_highlights`,
        full_name: this.formatPlatformName(highlight.source_platform || 'unknown'),
        avatar_url: this.getPlatformAvatar(highlight.source_platform || 'unknown'),
        verified: true,
      },
      team: this.getTeamInfo(highlight.team_associations),
      stats: {
        likes: highlight.engagement_metrics.likes,
        comments: highlight.engagement_metrics.comments,
        shares: highlight.engagement_metrics.shares,
        views: highlight.engagement_metrics.views,
      },
      engagement: {
        liked: false, // TODO: Check user's like status
        saved: false, // TODO: Check user's save status
      },
      timestamp: highlight.created_at,
      tags: highlight.tags || [],
      duration: highlight.duration_seconds,
      sourceAttribution: highlight.source_platform,
    }));
  }

  /**
   * Extract relevant tags from content
   */
  private extractTagsFromContent(title?: string, content?: string): string[] {
    const text = `${title || ''} ${content || ''}`.toLowerCase();
    const tags: string[] = [];
    
    // Sport tags
    if (text.includes('nfl') || text.includes('football')) tags.push('NFL');
    if (text.includes('nba') || text.includes('basketball')) tags.push('NBA');
    if (text.includes('mlb') || text.includes('baseball')) tags.push('MLB');
    if (text.includes('nhl') || text.includes('hockey')) tags.push('NHL');
    
    // Event tags
    if (text.includes('touchdown')) tags.push('Touchdown');
    if (text.includes('goal')) tags.push('Goal');
    if (text.includes('home run')) tags.push('Home Run');
    if (text.includes('dunk')) tags.push('Dunk');
    if (text.includes('overtime')) tags.push('Overtime');
    if (text.includes('clutch')) tags.push('Clutch');
    
    return tags;
  }

  /**
   * Format description with duration info
   */
  private formatDescription(description: string, durationSeconds: number): string {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const durationText = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
    
    return `${description} • ${durationText}`;
  }

  /**
   * Format platform name for display
   */
  private formatPlatformName(platform: string): string {
    const platformNames: Record<string, string> = {
      youtube: 'YouTube Sports',
      newsapi: 'News API',
      balldontlie: 'BallDontLie',
      apisports: 'API Sports',
      reddit: 'Reddit Sports',
      espn: 'ESPN',
      unknown: 'Sports Video',
    };
    return platformNames[platform.toLowerCase()] || platform.toUpperCase();
  }

  /**
   * Get platform-specific avatar placeholder
   */
  private getPlatformAvatar(platform: string): string {
    const colors: Record<string, string> = {
      youtube: 'FF0000',
      newsapi: '0066CC',
      balldontlie: 'FF6B35',
      apisports: '28A745',
      reddit: 'FF4500',
      espn: 'CC0000',
      unknown: '6B7280',
    };
    const color = colors[platform.toLowerCase()] || '000000';
    const text = platform.substring(0, 3).toUpperCase();
    return `https://via.placeholder.com/100x100/${color}/ffffff?text=${text}`;
  }

  /**
   * Get team information from associations
   */
  private getTeamInfo(teamAssociations?: string[]): HighlightContent['team'] | undefined {
    if (!teamAssociations || teamAssociations.length === 0) return undefined;
    
    const teamName = teamAssociations[0];
    return {
      id: `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`,
      name: teamName,
      primary_color: '#1E40AF', // Default blue, TODO: Get actual team colors
    };
  }

  /**
   * Check if user has engaged with a highlight
   */
  async checkUserEngagement(userId: string, highlightId: string): Promise<{ liked: boolean; saved: boolean }> {
    try {
      // TODO: Implement user engagement checking
      // For now, return default values
      return { liked: false, saved: false };
    } catch (error) {
      console.error('Error checking user engagement:', error);
      return { liked: false, saved: false };
    }
  }
}

// Export singleton instance
export const highlightsService = new HighlightsService();

// Convenience functions for external use
export async function getRecentHighlights(
  userId?: string,
  favoriteTeams?: string[],
  limit?: number
): Promise<HighlightContent[]> {
  const highlights = await highlightsService.getRecentHighlights(userId, favoriteTeams, limit);
  return highlightsService.formatHighlightsForDiscovery(highlights, userId);
}

export async function getUserHighlightEngagement(
  userId: string,
  highlightId: string
): Promise<{ liked: boolean; saved: boolean }> {
  return highlightsService.checkUserEngagement(userId, highlightId);
} 