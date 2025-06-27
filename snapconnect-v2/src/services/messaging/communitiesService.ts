/**
 * Communities Service
 * 
 * Handles community-based messaging with automatic 1-hour expiration.
 * Supports team-specific and league-wide communities based on user preferences.
 */
console.log('🏈 CommunitiesService: Module loading...');

import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';

console.log('🏈 CommunitiesService: Imports successful');

type Community = Database['public']['Tables']['communities']['Row'];
type CommunityMembership = Database['public']['Tables']['community_memberships']['Row'];
type CommunityMessage = Database['public']['Tables']['community_messages']['Row'];
type CommunityMessageInsert = Database['public']['Tables']['community_messages']['Insert'];

export interface CommunityWithDetails extends Community {
  is_member: boolean;
  unread_count?: number;
  last_message?: {
    content: string | null;
    sender_username: string;
    created_at: string;
  };
  team_info?: {
    name: string;
    abbreviation: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
  };
}

export interface CommunityMessageWithSender extends CommunityMessage {
  sender_username: string;
  sender_avatar: string | null;
  reaction_count?: number;
  user_reaction?: string | null;
  replies_count?: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  user_reacted: boolean;
}

/**
 * Communities service for managing community interactions
 */
class CommunitiesService {
  /**
   * Get user's eligible communities (based on their team/league preferences)
   */
  async getUserCommunities(): Promise<CommunityWithDetails[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // First, try to auto-join user to eligible communities if they haven't been joined yet
      await this.autoJoinUserCommunities();

      // Get communities the user is eligible for
      const { data: communities, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_memberships!inner(user_id, last_read_at),
          teams(name, abbreviation, primary_color, secondary_color, logo_url)
        `)
        .eq('community_memberships.user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Database error fetching communities:', error);
        throw new DatabaseError('Failed to fetch user communities', error);
      }

      console.log('Raw communities result:', communities?.length || 0);
      if (!communities) return [];

      // Get last message and unread count for each community
      const communitiesWithDetails = await Promise.all(
        communities.map(async (community) => {
          const membership = Array.isArray(community.community_memberships) 
            ? community.community_memberships[0] 
            : community.community_memberships;

          // Get last message
          const { data: lastMessage } = await supabase
            .from('community_messages')
            .select(`
              content,
              created_at,
              profiles!sender_id(username)
            `)
            .eq('community_id', community.id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('community_messages')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)
            .gt('created_at', membership?.last_read_at || new Date(0).toISOString())
            .gt('expires_at', new Date().toISOString());

          const teamInfo = Array.isArray(community.teams) 
            ? community.teams[0] 
            : community.teams;

          const senderProfile = lastMessage?.profiles 
            ? (Array.isArray(lastMessage.profiles) ? lastMessage.profiles[0] : lastMessage.profiles)
            : null;

          return {
            ...community,
            is_member: true,
            unread_count: unreadCount || 0,
            last_message: lastMessage ? {
              content: lastMessage.content,
              sender_username: senderProfile?.username || 'Unknown',
              created_at: lastMessage.created_at,
            } : undefined,
            team_info: teamInfo ? {
              name: teamInfo.name,
              abbreviation: teamInfo.abbreviation,
              primary_color: teamInfo.primary_color,
              secondary_color: teamInfo.secondary_color,
              logo_url: teamInfo.logo_url,
            } : undefined,
          };
        })
      );

      return communitiesWithDetails;
    } catch (error) {
      console.error('Error getting user communities:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get user communities');
    }
  }

  /**
   * Get available communities (not yet joined)
   */
  async getAvailableCommunities(): Promise<CommunityWithDetails[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Get user's sports preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_sports_preferences')
        .select('favorite_teams, preferred_leagues')
        .eq('user_id', userId)
        .single();

      if (prefsError) {
        throw new DatabaseError('Failed to get user preferences', prefsError);
      }

      if (!preferences) return [];

      // Get communities user is eligible for but not a member of
      const { data: communities, error } = await supabase
        .from('communities')
        .select(`
          *,
          teams(name, abbreviation, primary_color, secondary_color, logo_url)
        `)
        .eq('is_active', true)
        .not('id', 'in', `(
          SELECT community_id 
          FROM community_memberships 
          WHERE user_id = '${userId}'
        )`);

      if (error) {
        throw new DatabaseError('Failed to fetch available communities', error);
      }

      if (!communities) return [];

      // Filter by user eligibility
      const eligibleCommunities = communities.filter(community => {
        if (community.type === 'league') {
          return preferences.preferred_leagues?.includes(community.league);
        } else if (community.type === 'team') {
          return preferences.favorite_teams?.includes(community.team_id);
        }
        return false;
      });

      return eligibleCommunities.map(community => {
        const teamInfo = Array.isArray(community.teams) 
          ? community.teams[0] 
          : community.teams;

        return {
          ...community,
          is_member: false,
          team_info: teamInfo ? {
            name: teamInfo.name,
            abbreviation: teamInfo.abbreviation,
            primary_color: teamInfo.primary_color,
            secondary_color: teamInfo.secondary_color,
            logo_url: teamInfo.logo_url,
          } : undefined,
        };
      });
    } catch (error) {
      console.error('Error getting available communities:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get available communities');
    }
  }

  /**
   * Join a community
   */
  async joinCommunity(communityId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'member',
        });

      if (error) {
        throw new DatabaseError('Failed to join community', error);
      }

      // Update member count
      await this.updateMemberCount(communityId);
    } catch (error) {
      console.error('Error joining community:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to join community');
    }
  }

  /**
   * Leave a community
   */
  async leaveCommunity(communityId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError('Failed to leave community', error);
      }

      // Update member count
      await this.updateMemberCount(communityId);
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to leave community');
    }
  }

  /**
   * Get community messages
   */
  async getCommunityMessages(
    communityId: string, 
    limit = 50, 
    before?: string
  ): Promise<CommunityMessageWithSender[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is a member
      const { data: membership } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new DatabaseError('User is not a member of this community');
      }

      let query = supabase
        .from('community_messages')
        .select(`
          *,
          profiles!sender_id(username, avatar_url)
        `)
        .eq('community_id', communityId)
        .gt('expires_at', new Date().toISOString()) // Only non-expired messages
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to fetch community messages', error);
      }

      if (!messages) return [];

      // Get reactions for each message
      const messagesWithDetails = await Promise.all(
        messages.map(async (message) => {
          const senderProfile = Array.isArray(message.profiles) 
            ? message.profiles[0] 
            : message.profiles;

          // Get reaction count and user's reaction
          const { data: reactions } = await supabase
            .from('community_message_reactions')
            .select('emoji, user_id')
            .eq('message_id', message.id);

          const reactionCount = reactions?.length || 0;
          const userReaction = reactions?.find(r => r.user_id === userId)?.emoji || null;

          // Get replies count
          const { count: repliesCount } = await supabase
            .from('community_messages')
            .select('*', { count: 'exact', head: true })
            .eq('reply_to', message.id)
            .gt('expires_at', new Date().toISOString());

          return {
            ...message,
            sender_username: senderProfile?.username || 'Unknown',
            sender_avatar: senderProfile?.avatar_url || null,
            reaction_count: reactionCount,
            user_reaction: userReaction,
            replies_count: repliesCount || 0,
          };
        })
      );

      return messagesWithDetails.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting community messages:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get community messages');
    }
  }

  /**
   * Send a message to a community
   */
  async sendCommunityMessage(
    communityId: string,
    content?: string,
    mediaUrl?: string,
    mediaType: 'text' | 'photo' | 'video' | 'story_share' = 'text',
    replyTo?: string
  ): Promise<CommunityMessageWithSender> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is a member
      const { data: membership } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new DatabaseError('User is not a member of this community');
      }

      // Insert message with 1-hour expiration
      const messageData: CommunityMessageInsert = {
        community_id: communityId,
        sender_id: userId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        reply_to: replyTo,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      };

      const { data: message, error } = await supabase
        .from('community_messages')
        .insert(messageData)
        .select(`
          *,
          profiles!sender_id(username, avatar_url)
        `)
        .single();

      if (error) {
        throw new DatabaseError('Failed to send community message', error);
      }

      // Update community updated_at
      await supabase
        .from('communities')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', communityId);

      const senderProfile = Array.isArray(message.profiles) 
        ? message.profiles[0] 
        : message.profiles;

      return {
        ...message,
        sender_username: senderProfile?.username || 'Unknown',
        sender_avatar: senderProfile?.avatar_url || null,
        reaction_count: 0,
        user_reaction: null,
        replies_count: 0,
      };
    } catch (error) {
      console.error('Error sending community message:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to send community message');
    }
  }

  /**
   * Add reaction to community message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('community_message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        });

      if (error) {
        // If reaction already exists, remove it (toggle behavior)
        if (error.code === '23505') {
          await supabase
            .from('community_message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji);
        } else {
          throw new DatabaseError('Failed to add reaction', error);
        }
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to add reaction');
    }
  }

  /**
   * Mark community as read
   */
  async markCommunityAsRead(communityId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('community_memberships')
        .update({ last_read_at: new Date().toISOString() })
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError('Failed to mark community as read', error);
      }
    } catch (error) {
      console.error('Error marking community as read:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to mark community as read');
    }
  }

  /**
   * Subscribe to community messages
   */
  subscribeToMessages(
    communityId: string, 
    onMessage: (message: CommunityMessageWithSender) => void
  ) {
    return supabase
      .channel(`community-${communityId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `community_id=eq.${communityId}`,
      }, async (payload) => {
        // Fetch full message with sender details
        const { data: messageWithSender } = await supabase
          .from('community_messages')
          .select(`
            *,
            profiles!sender_id(username, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (messageWithSender) {
          const senderProfile = Array.isArray(messageWithSender.profiles) 
            ? messageWithSender.profiles[0] 
            : messageWithSender.profiles;

          onMessage({
            ...messageWithSender,
            sender_username: senderProfile?.username || 'Unknown',
            sender_avatar: senderProfile?.avatar_url || null,
            reaction_count: 0,
            user_reaction: null,
            replies_count: 0,
          });
        }
      })
      .subscribe();
  }

  /**
   * Auto-join user to eligible communities based on their sports preferences
   */
  private async autoJoinUserCommunities(): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Get user's sports preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_sports_preferences')
        .select('favorite_teams, preferred_leagues')
        .eq('user_id', userId)
        .single();

      if (prefsError) {
        console.error('Auto-join: preferences error:', prefsError);
        return;
      }

      if (!preferences) {
        return; // No preferences found, skip auto-join
      }

      // First get user's existing memberships
      const { data: existingMemberships } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', userId);

      const existingCommunityIds = existingMemberships?.map(m => m.community_id) || [];

      // Get all active communities
      const { data: allCommunities, error: communitiesError } = await supabase
        .from('communities')
        .select('id, type, team_id, league')
        .eq('is_active', true);

      if (communitiesError) {
        console.error('Auto-join: Error getting communities:', communitiesError);
        return;
      }

      // Filter out communities user is already a member of
      const availableCommunities = allCommunities?.filter(c => 
        !existingCommunityIds.includes(c.id)
      ) || [];

      if (!availableCommunities || availableCommunities.length === 0) {
        return;
      }

      // Filter and join eligible communities
      const communitiesToJoin = availableCommunities.filter(community => {
        if (community.type === 'league') {
          return preferences.preferred_leagues?.includes(community.league);
        } else if (community.type === 'team') {
          return preferences.favorite_teams?.includes(community.team_id);
        }
        return false;
      });

      // Join eligible communities
      if (communitiesToJoin.length > 0) {
        console.log('Auto-join: Joining communities...');
        const memberships = communitiesToJoin.map(community => ({
          community_id: community.id,
          user_id: userId,
          role: 'member' as const,
        }));

        console.log('Auto-join: Inserting memberships:', memberships);
        const { error: insertError } = await supabase
          .from('community_memberships')
          .insert(memberships);

        if (insertError) {
          console.error('Auto-join: Error inserting memberships:', insertError);
        } else {
          console.log('Auto-join: Memberships inserted successfully');
        }

        // Update member counts for joined communities
        console.log('Auto-join: Updating member counts...');
        await Promise.all(
          communitiesToJoin.map(community => this.updateMemberCount(community.id))
        );
        console.log('Auto-join: Member counts updated');
      } else {
        console.log('Auto-join: No eligible communities found to join');
      }
    } catch (error) {
      console.error('Error auto-joining communities:', error);
      // Don't throw - this is a background process
    }
  }

  /**
   * Private helper to update member count
   */
  private async updateMemberCount(communityId: string): Promise<void> {
    const { count } = await supabase
      .from('community_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId);

    await supabase
      .from('communities')
      .update({ 
        member_count: count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', communityId);
  }
}

console.log('🏈 CommunitiesService: Creating service instance...');
export const communitiesService = new CommunitiesService();
console.log('🏈 CommunitiesService: Service instance created successfully'); 