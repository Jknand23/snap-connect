/**
 * Stories Service
 * 
 * Manages user stories including creation, viewing, and privacy controls.
 * Handles 24-hour expiration, view tracking, and team-based filtering.
 */
import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';

type Story = Database['public']['Tables']['stories']['Row'];
type StoryInsert = Database['public']['Tables']['stories']['Insert'];
type StoryView = Database['public']['Tables']['story_views']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface StoryWithProfile extends Story {
  profiles: Profile;
  has_viewed: boolean;
  viewer_count: number;
}

export interface CreateStoryData {
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  privacySetting?: 'public' | 'friends' | 'teams';
  teamFilter?: string[];
  thumbnailUrl?: string;
}

export interface StoryFeed {
  user: Profile;
  stories: StoryWithProfile[];
  hasUnviewed: boolean;
}

/**
 * Stories service for managing user stories
 */
export class StoriesService {
  /**
   * Create a new story
   */
  async createStory(storyData: CreateStoryData): Promise<Story> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const insertData: StoryInsert = {
        user_id: userId,
        media_url: storyData.mediaUrl,
        media_type: storyData.mediaType,
        caption: storyData.caption || null,
        privacy_setting: storyData.privacySetting || 'friends',
        team_filter: storyData.teamFilter || null,
        thumbnail_url: storyData.thumbnailUrl || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      const { data, error } = await supabase
        .from('stories')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create story', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to create story', error);
    }
  }

  /**
   * Get stories feed for current user
   */
  async getStoriesFeed(): Promise<StoryFeed[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Get all non-expired stories first, then filter by privacy in code
      // This is a simplified approach to avoid complex SQL queries
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!inner(*),
          story_views!left(viewer_id)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get stories feed', error);
      }

      // For now, return all public stories and own stories
      // TODO: Implement proper friend filtering once friendships are set up
      const filteredStories = stories?.filter(story => 
        story.privacy_setting === 'public' || story.user_id === userId
      ) || [];

      // Group stories by user and add view information
      const storiesByUser = new Map<string, StoryFeed>();

      filteredStories.forEach((story: any) => {
        const hasViewed = story.story_views?.some((view: any) => view.viewer_id === userId);
        
        const storyWithProfile: StoryWithProfile = {
          ...story,
          has_viewed: hasViewed,
          viewer_count: story.view_count || 0,
        };

        const userKey = story.profiles.id;
        if (!storiesByUser.has(userKey)) {
          storiesByUser.set(userKey, {
            user: story.profiles,
            stories: [],
            hasUnviewed: false,
          });
        }

        const userFeed = storiesByUser.get(userKey)!;
        userFeed.stories.push(storyWithProfile);
        
        if (!hasViewed) {
          userFeed.hasUnviewed = true;
        }
      });

      // Sort users by whether they have unviewed stories
      return Array.from(storiesByUser.values()).sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });
    } catch (error) {
      throw new DatabaseError('Failed to get stories feed', error);
    }
  }

  /**
   * Get current user's stories
   */
  async getUserStories(): Promise<StoryWithProfile[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!inner(*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get user stories', error);
      }

      return (data || []).map((story: any) => ({
        ...story,
        has_viewed: true, // User has always "viewed" their own stories
        viewer_count: story.view_count || 0,
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get user stories', error);
    }
  }

  /**
   * Get stories by user ID
   */
  async getStoriesByUserId(targetUserId: string): Promise<StoryWithProfile[]> {
    try {
      const currentUserId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!inner(*),
          story_views!left(viewer_id)
        `)
        .eq('user_id', targetUserId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get stories by user', error);
      }

      return (data || []).map((story: any) => {
        const hasViewed = story.story_views?.some((view: any) => view.viewer_id === currentUserId);
        
        return {
          ...story,
          has_viewed: hasViewed,
          viewer_count: story.view_count || 0,
        };
      });
    } catch (error) {
      throw new DatabaseError('Failed to get stories by user', error);
    }
  }

  /**
   * Mark story as viewed
   */
  async viewStory(storyId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Insert view record (will be ignored if already exists due to unique constraint)
      const { error: viewError } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: userId,
        });

      // Ignore duplicate key errors
      if (viewError && !viewError.message.includes('duplicate key')) {
        throw new DatabaseError('Failed to record story view', viewError);
      }

      // Increment view count
      const { error: updateError } = await supabase
        .rpc('increment_story_views', { story_id: storyId });

      if (updateError) {
        console.warn('Failed to increment story view count:', updateError);
        // Don't throw here, view recording is more important than count
      }
    } catch (error) {
      throw new DatabaseError('Failed to view story', error);
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId); // Ensure user can only delete their own stories

      if (error) {
        throw new DatabaseError('Failed to delete story', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to delete story', error);
    }
  }

  /**
   * Get story viewers
   */
  async getStoryViewers(storyId: string): Promise<Profile[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // First verify the story belongs to the current user
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (storyError) {
        throw new DatabaseError('Failed to get story', storyError);
      }

      if (story.user_id !== userId) {
        throw new DatabaseError('Not authorized to view story viewers');
      }

      const { data, error } = await supabase
        .from('story_views')
        .select(`
          profiles!inner(*)
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get story viewers', error);
      }

      return (data || []).map((view: any) => view.profiles);
    } catch (error) {
      throw new DatabaseError('Failed to get story viewers', error);
    }
  }

  /**
   * Update story privacy settings
   */
  async updateStoryPrivacy(
    storyId: string, 
    privacySetting: 'public' | 'friends' | 'teams',
    teamFilter?: string[]
  ): Promise<Story> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('stories')
        .update({
          privacy_setting: privacySetting,
          team_filter: teamFilter || null,
        })
        .eq('id', storyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update story privacy', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to update story privacy', error);
    }
  }

  /**
   * Get stories count for user
   */
  async getStoriesCount(userId?: string): Promise<number> {
    try {
      const targetUserId = userId || await dbUtils.getCurrentUserId();

      const { count, error } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw new DatabaseError('Failed to get stories count', error);
      }

      return count || 0;
    } catch (error) {
      throw new DatabaseError('Failed to get stories count', error);
    }
  }

  /**
   * Cleanup expired stories (should be called periodically)
   */
  async cleanupExpiredStories(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_stories');

      if (error) {
        throw new DatabaseError('Failed to cleanup expired stories', error);
      }

      return data || 0;
    } catch (error) {
      throw new DatabaseError('Failed to cleanup expired stories', error);
    }
  }

  /**
   * Subscribe to new stories from friends
   */
  subscribeToFriendsStories(callback: (story: Story) => void) {
    const subscription = supabase
      .channel('stories-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
        },
        (payload) => {
          callback(payload.new as Story);
        }
      )
      .subscribe();

    return subscription;
  }
}

// Export singleton instance
export const storiesService = new StoriesService(); 