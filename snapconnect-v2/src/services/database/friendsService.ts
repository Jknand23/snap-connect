/**
 * Friends Service
 * 
 * Handles all friend-related database operations including search, requests,
 * acceptance, and friend management for the sports social network.
 */
import { supabase, DatabaseError, dbUtils } from './supabase';

export interface FriendProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_teams?: string[];
  is_online?: boolean;
  mutual_teams?: string[];
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  requester_profile: FriendProfile;
}

export interface FriendWithStatus extends FriendProfile {
  friendship_status: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
  friendship_id?: string;
  last_message_time?: string;
  has_new_messages?: boolean;
}

class FriendsService {
  /**
   * Search users by username or shared team interests
   */
  async searchUsers(query: string, currentUserId: string): Promise<FriendWithStatus[]> {
    try {
      // First get current user's teams for relevance scoring
      const { data: currentUserPrefs } = await supabase
        .from('user_sports_preferences')
        .select('favorite_teams')
        .eq('user_id', currentUserId)
        .single();

      const currentUserTeams = currentUserPrefs?.favorite_teams || [];

      // Search users by username with sports preferences
      const { data: searchResults, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          bio,
          user_sports_preferences(favorite_teams)
        `)
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(20);

      if (error) throw new DatabaseError('Failed to search users', error);

      // Get friendship statuses for all found users
      const userIds = searchResults?.map(user => user.id) || [];
      if (userIds.length === 0) return [];

      const { data: friendships, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
        .in('requester_id', [...userIds, currentUserId])
        .in('addressee_id', [...userIds, currentUserId]);

      if (friendshipError) throw new DatabaseError('Failed to get friendship statuses', friendshipError);

      // Process results with friendship status and mutual teams
      const results: FriendWithStatus[] = (searchResults || []).map(user => {
        const userSportsPrefs = Array.isArray(user.user_sports_preferences) 
          ? user.user_sports_preferences[0] 
          : user.user_sports_preferences;
        const userTeams = userSportsPrefs?.favorite_teams || [];
        const mutualTeams = currentUserTeams.filter((team: string) => userTeams.includes(team));
        
        // Find friendship status
        const friendship = friendships?.find(f => 
          (f.requester_id === currentUserId && f.addressee_id === user.id) ||
          (f.requester_id === user.id && f.addressee_id === currentUserId)
        );

        let friendshipStatus: FriendWithStatus['friendship_status'] = 'none';
        if (friendship) {
          if (friendship.status === 'accepted') {
            friendshipStatus = 'friends';
          } else if (friendship.status === 'blocked') {
            friendshipStatus = 'blocked';
          } else if (friendship.requester_id === currentUserId) {
            friendshipStatus = 'pending_sent';
          } else {
            friendshipStatus = 'pending_received';
          }
        }

        return {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          favorite_teams: userTeams,
          mutual_teams: mutualTeams,
          friendship_status: friendshipStatus,
          friendship_id: friendship?.id,
        };
      });

      // Sort by relevance: friends first, then mutual teams, then alphabetical
      return results.sort((a, b) => {
        if (a.friendship_status === 'friends' && b.friendship_status !== 'friends') return -1;
        if (b.friendship_status === 'friends' && a.friendship_status !== 'friends') return 1;
        if ((a.mutual_teams?.length || 0) !== (b.mutual_teams?.length || 0)) {
          return (b.mutual_teams?.length || 0) - (a.mutual_teams?.length || 0);
        }
        return a.username.localeCompare(b.username);
      });

    } catch (error) {
      console.error('Error searching users:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to search users');
    }
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(addresseeId: string): Promise<void> {
    try {
      const requesterId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) throw new DatabaseError('Failed to send friend request', error);
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to send friend request');
    }
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId);

      if (error) throw new DatabaseError('Failed to accept friend request', error);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to accept friend request');
    }
  }

  /**
   * Decline or cancel a friend request
   */
  async declineFriendRequest(friendshipId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw new DatabaseError('Failed to decline friend request', error);
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to decline friend request');
    }
  }

  /**
   * Get all friends for a user
   */
  async getFriends(userId?: string): Promise<FriendProfile[]> {
    try {
      const currentUserId = userId || await dbUtils.getCurrentUserId();

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(
            id, username, full_name, avatar_url, bio,
            user_sports_preferences(favorite_teams)
          ),
          addressee:profiles!friendships_addressee_id_fkey(
            id, username, full_name, avatar_url, bio,
            user_sports_preferences(favorite_teams)
          )
        `)
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
        .eq('status', 'accepted');

      if (error) throw new DatabaseError('Failed to get friends', error);

      // Extract friend profiles (the other person in each friendship)
      const friends: FriendProfile[] = (friendships || []).map(friendship => {
        const friendProfile = friendship.requester_id === currentUserId 
          ? friendship.addressee 
          : friendship.requester;

        return {
          id: friendProfile.id,
          username: friendProfile.username,
          full_name: friendProfile.full_name,
          avatar_url: friendProfile.avatar_url,
          bio: friendProfile.bio,
          favorite_teams: friendProfile.user_sports_preferences?.favorite_teams || [],
        };
      });

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get friends');
    }
  }

  /**
   * Get pending friend requests (both sent and received)
   */
  async getPendingRequests(): Promise<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }> {
    try {
      const currentUserId = await dbUtils.getCurrentUserId();

      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(
            id, username, full_name, avatar_url, bio,
            user_sports_preferences(favorite_teams)
          ),
          addressee:profiles!friendships_addressee_id_fkey(
            id, username, full_name, avatar_url, bio,
            user_sports_preferences(favorite_teams)
          )
        `)
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
        .eq('status', 'pending');

      if (error) throw new DatabaseError('Failed to get pending requests', error);

      const sent: FriendRequest[] = [];
      const received: FriendRequest[] = [];

      (requests || []).forEach(request => {
        const friendRequest: FriendRequest = {
          id: request.id,
          requester_id: request.requester_id,
          addressee_id: request.addressee_id,
          status: request.status,
          created_at: request.created_at,
          requester_profile: {
            id: request.requester.id,
            username: request.requester.username,
            full_name: request.requester.full_name,
            avatar_url: request.requester.avatar_url,
            bio: request.requester.bio,
            favorite_teams: request.requester.user_sports_preferences?.favorite_teams || [],
          }
        };

        if (request.requester_id === currentUserId) {
          sent.push(friendRequest);
        } else {
          received.push(friendRequest);
        }
      });

      return { sent, received };
    } catch (error) {
      console.error('Error getting pending requests:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get pending requests');
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<void> {
    try {
      const currentUserId = await dbUtils.getCurrentUserId();

      // First, try to update existing friendship to blocked
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .single();

      if (existingFriendship) {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'blocked' })
          .eq('id', existingFriendship.id);

        if (error) throw new DatabaseError('Failed to block user', error);
      } else {
        // Create new blocked relationship
        const { error } = await supabase
          .from('friendships')
          .insert({
            requester_id: currentUserId,
            addressee_id: userId,
            status: 'blocked'
          });

        if (error) throw new DatabaseError('Failed to block user', error);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to block user');
    }
  }

  /**
   * Get friends with recent message activity for the messages screen
   */
  async getFriendsWithMessages(): Promise<FriendWithStatus[]> {
    try {
      const friends = await this.getFriends();
      
      // For now, return friends with mock message data
      // TODO: Integrate with actual messaging service once implemented
      return friends.map(friend => ({
        ...friend,
        friendship_status: 'friends' as const,
        last_message_time: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        has_new_messages: Math.random() > 0.7,
        is_online: Math.random() > 0.5,
      }));
    } catch (error) {
      console.error('Error getting friends with messages:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get friends with messages');
    }
  }
}

export const friendsService = new FriendsService(); 