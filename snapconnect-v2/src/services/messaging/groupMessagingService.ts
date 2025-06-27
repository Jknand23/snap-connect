/**
 * Group Messaging Service
 * 
 * Handles ephemeral messaging in group chats where messages disappear only after
 * ALL group members have viewed them. Extends the disappearing messages system
 * with group-specific logic for coordinated message lifecycle management.
 */

import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';
import { disappearingMessagesService, EnhancedMessage } from './disappearingMessagesService';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type Chat = Database['public']['Tables']['chats']['Row'];
type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];

export interface GroupMessage extends EnhancedMessage {
  total_participants: number;
  viewed_by_count: number;
  viewed_by_usernames: string[];
  pending_viewers: string[];
  can_disappear: boolean;
}

export interface GroupChatInfo {
  id: string;
  name: string;
  participants: GroupParticipant[];
  active_participants: GroupParticipant[];
  total_members: number;
}

export interface GroupParticipant {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  joined_at: string;
  is_active: boolean;
  last_activity?: string;
}

export interface GroupMessageStats {
  total_messages: number;
  pending_disappear: number;
  total_views: number;
  members_who_need_to_view: string[];
}

/**
 * Service for managing ephemeral group messaging where messages disappear
 * only after ALL group members have viewed them
 */
export class GroupMessagingService {

  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string> {
    return await dbUtils.getCurrentUserId();
  }

  /**
   * Send ephemeral message to group chat
   */
  async sendGroupMessage(
    chatId: string,
    content?: string,
    mediaUrl?: string,
    mediaType: 'text' | 'photo' | 'video' | 'story_share' = 'text'
  ): Promise<GroupMessage> {
    try {
      const userId = await dbUtils.getCurrentUserId();
      console.log('🔍 GroupMessagingService: Sending message from user:', userId, 'to chat:', chatId);

      // Verify this is a group chat and user is participant
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('type')
        .eq('id', chatId)
        .single();

      console.log('🔍 Chat lookup result:', { chat, chatError });

      if (chatError) {
        console.error('❌ Failed to lookup chat:', chatError);
        throw new DatabaseError('Failed to lookup chat', chatError);
      }

      if (!chat || chat.type !== 'group') {
        console.error('❌ Chat validation failed:', { chat, expectedType: 'group' });
        throw new DatabaseError('This is not a group chat');
      }

      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      console.log('🔍 Participant lookup result:', { participant, participantError });

      if (participantError) {
        console.error('❌ Failed to lookup participant:', participantError);
        throw new DatabaseError('Failed to lookup participant', participantError);
      }

      if (!participant) {
        console.error('❌ User is not a participant in this group');
        throw new DatabaseError('Not authorized to send message to this group');
      }

      console.log('✅ Verification passed, sending message...');

      // Send the message (all group messages are ephemeral by default)
      const insertData: MessageInsert = {
        chat_id: chatId,
        sender_id: userId,
        content: content || null,
        media_url: mediaUrl || null,
        media_type: mediaType,
        is_disappearing: true, // All group messages are ephemeral
        created_at: new Date().toISOString(),
      };

      console.log('🔍 Inserting message with data:', insertData);

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(insertData)
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .single();

      console.log('🔍 Message insert result:', { message: message?.id, messageError });

      if (messageError) {
        console.error('❌ Failed to insert message:', messageError);
        throw new DatabaseError('Failed to send group message', messageError);
      }

      // Mark sender as having viewed their own message
      console.log('🔍 Marking message as viewed by sender...');
      await this.markGroupMessageAsViewed(message.id);
      console.log('✅ Message marked as viewed by sender');

      console.log('🔍 Getting enhanced group message...');
      const enhancedMessage = await this.getEnhancedGroupMessage(message.id);
      console.log('✅ Enhanced message retrieved:', enhancedMessage.id);
      
      return enhancedMessage;
    } catch (error) {
      throw new DatabaseError('Failed to send group message', error);
    }
  }

  /**
   * Mark message as viewed by current user and check if all members have viewed it
   */
  async markGroupMessageAsViewed(messageId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();
      console.log('🔍 markGroupMessageAsViewed: User', userId, 'viewing message', messageId);
      
      // Get message and chat info
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          chats!inner(id, type)
        `)
        .eq('id', messageId)
        .single();

      console.log('🔍 Message lookup for view marking:', { message: message?.id, messageError });

      if (messageError) {
        console.error('❌ Failed to lookup message for view marking:', messageError);
        throw new DatabaseError('Failed to lookup message for view marking', messageError);
      }

      if (!message) {
        console.error('❌ Message not found for view marking');
        throw new DatabaseError('Message not found');
      }

      const chat = Array.isArray(message.chats) ? message.chats[0] : message.chats;
      console.log('🔍 Chat type verification:', { chatType: chat.type, expected: 'group' });
      
      if (chat.type !== 'group') {
        console.error('❌ Not a group chat message');
        throw new DatabaseError('This is not a group chat message');
      }

      // Record the view
      console.log('🔍 Calling mark_group_message_viewed RPC function...');
      const { error: viewError } = await supabase.rpc('mark_group_message_viewed', {
        p_message_id: messageId,
        p_viewer_id: userId
      });

      console.log('🔍 mark_group_message_viewed RPC result:', { viewError });

      if (viewError) {
        console.error('❌ Failed to mark group message as viewed:', viewError);
        throw new DatabaseError('Failed to mark group message as viewed', viewError);
      }

      console.log('✅ Message marked as viewed, checking disappearance...');

      // Check if all group members have now viewed the message
      await this.checkAndTriggerGroupMessageDisappearance(messageId);
      
      console.log('✅ markGroupMessageAsViewed completed successfully');
    } catch (error) {
      console.error('❌ markGroupMessageAsViewed failed:', error);
      throw new DatabaseError('Failed to mark group message as viewed', error);
    }
  }

  /**
   * Get enhanced group message with view statistics
   */
  async getEnhancedGroupMessage(messageId: string): Promise<GroupMessage> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data: message, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(username, avatar_url),
          message_views!left(viewer_id, viewed_at, profiles(username)),
          chats!inner(id, type)
        `)
        .eq('id', messageId)
        .single();

      if (error) {
        throw new DatabaseError('Failed to get group message', error);
      }

      // Get total group participants
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, profiles(username)')
        .eq('chat_id', message.chat_id);

      const totalParticipants = participants?.length || 0;
      const viewedByCount = message.message_views?.length || 0;
      const viewedByUsernames = message.message_views?.map((v: any) => v.profiles?.username || 'Unknown') || [];
      
      const allParticipantUsernames = participants?.map((p: any) => p.profiles?.username || 'Unknown') || [];
      const pendingViewers = allParticipantUsernames.filter(username => !viewedByUsernames.includes(username));

      const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
      const userView = message.message_views?.find((v: any) => v.viewer_id === userId);
      const isOwnMessage = message.sender_id === userId;

      return {
        ...message,
        sender_username: profile?.username || 'Unknown',
        sender_profile: profile,
        is_viewed_by_me: !!userView,
        can_be_viewed: isOwnMessage || !message.should_disappear,
        total_participants: totalParticipants,
        viewed_by_count: viewedByCount,
        viewed_by_usernames: viewedByUsernames,
        pending_viewers: pendingViewers,
        can_disappear: viewedByCount >= totalParticipants,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get enhanced group message', error);
    }
  }

  /**
   * Get group chat messages with enhanced view tracking
   */
  async getGroupChatMessages(chatId: string, limit = 50, before?: string): Promise<GroupMessage[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to view group messages');
      }

      // Get messages with view tracking
      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(username, avatar_url),
          message_views!left(viewer_id, viewed_at, profiles(username))
        `)
        .eq('chat_id', chatId)
        .eq('should_disappear', false) // Only show messages not marked for deletion
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get group messages', error);
      }

      // Get total participants for this chat
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, profiles(username)')
        .eq('chat_id', chatId);

      const totalParticipants = participants?.length || 0;
      const allParticipantUsernames = participants?.map((p: any) => p.profiles?.username || 'Unknown') || [];

      // Enhance each message with group-specific information
      const enhancedMessages: GroupMessage[] = (messages || []).map((message: any) => {
        const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
        const userView = message.message_views?.find((v: any) => v.viewer_id === userId);
        const isOwnMessage = message.sender_id === userId;
        
        const viewedByCount = message.message_views?.length || 0;
        const viewedByUsernames = message.message_views?.map((v: any) => v.profiles?.username || 'Unknown') || [];
        const pendingViewers = allParticipantUsernames.filter(username => !viewedByUsernames.includes(username));

        return {
          ...message,
          sender_username: profile?.username || 'Unknown',
          sender_profile: profile,
          is_viewed_by_me: !!userView,
          can_be_viewed: isOwnMessage || !message.should_disappear,
          total_participants: totalParticipants,
          viewed_by_count: viewedByCount,
          viewed_by_usernames: viewedByUsernames,
          pending_viewers: pendingViewers,
          can_disappear: viewedByCount >= totalParticipants,
        };
      });

      return enhancedMessages.reverse(); // Return in chronological order
    } catch (error) {
      throw new DatabaseError('Failed to get group chat messages', error);
    }
  }

  /**
   * Get group chat information with participant details
   */
  async getGroupChatInfo(chatId: string): Promise<GroupChatInfo> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to view group information');
      }

      // Get chat details
      const { data: chat } = await supabase
        .from('chats')
        .select('id, name, type')
        .eq('id', chatId)
        .single();

      if (!chat || chat.type !== 'group') {
        throw new DatabaseError('This is not a group chat');
      }

      // Get all participants
      const { data: participants } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          role,
          joined_at,
          profiles!inner(username, avatar_url)
        `)
        .eq('chat_id', chatId);

      // Get active participants (those currently in the chat)
      const { data: activeParticipants } = await supabase
        .from('chat_presence')
        .select(`
          user_id,
          is_active,
          last_activity,
          profiles!inner(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .eq('is_active', true);

      const participantsList: GroupParticipant[] = (participants || []).map((p: any) => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        const activeInfo = activeParticipants?.find((ap: any) => ap.user_id === p.user_id);
        
        return {
          user_id: p.user_id,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          role: p.role,
          joined_at: p.joined_at,
          is_active: !!activeInfo,
          last_activity: activeInfo?.last_activity,
        };
      });

      const activeParticipantsList = participantsList.filter(p => p.is_active);

      return {
        id: chat.id,
        name: chat.name || 'Group Chat',
        participants: participantsList,
        active_participants: activeParticipantsList,
        total_members: participantsList.length,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get group chat info', error);
    }
  }

  /**
   * Check if all group members have viewed message and mark for disappearance
   */
  private async checkAndTriggerGroupMessageDisappearance(messageId: string): Promise<void> {
    try {
      // Call database function to check and potentially mark message for disappearance
      const { error } = await supabase.rpc('check_group_message_disappearance', {
        p_message_id: messageId
      });

      if (error) {
        throw new DatabaseError('Failed to check group message disappearance', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to trigger group message disappearance check', error);
    }
  }

  /**
   * Get group message statistics for debugging/monitoring
   */
  async getGroupMessageStats(chatId: string): Promise<GroupMessageStats> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to view group stats');
      }

      // Get total messages in group
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .eq('is_disappearing', true);

      // Get messages pending disappearance
      const { count: pendingDisappear } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .eq('should_disappear', true);

      // Get message IDs for this chat first
      const { data: chatMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId);

      const messageIds = chatMessages?.map(m => m.id) || [];

      // Get total views across all messages
      const { data: viewCounts } = await supabase
        .from('message_views')
        .select('message_id')
        .in('message_id', messageIds);

      // Get participants who still need to view recent messages
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('profiles(username)')
        .eq('chat_id', chatId);

      const participantUsernames = participants?.map((p: any) => p.profiles?.username || 'Unknown') || [];

      return {
        total_messages: totalMessages || 0,
        pending_disappear: pendingDisappear || 0,
        total_views: viewCounts?.length || 0,
        members_who_need_to_view: participantUsernames, // This would need more complex logic in practice
      };
    } catch (error) {
      throw new DatabaseError('Failed to get group message stats', error);
    }
  }

  /**
   * Subscribe to group messages with real-time updates
   */
  subscribeToGroupMessages(
    chatId: string,
    onMessage: (message: GroupMessage) => void,
    onMessageDisappeared: (messageId: string) => void,
    onViewStatusUpdate: (messageId: string, viewStats: { viewed_by_count: number; pending_viewers: string[] }) => void
  ) {
    try {
      // Subscribe to new messages
      const messageSubscription = supabase
        .channel(`group-messages-${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        }, async (payload) => {
          if (payload.new) {
            const enhancedMessage = await this.getEnhancedGroupMessage(payload.new.id);
            onMessage(enhancedMessage);
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        }, (payload) => {
          if (payload.old) {
            onMessageDisappeared(payload.old.id);
          }
        })
        .subscribe();

      // Subscribe to view status changes
      const viewSubscription = supabase
        .channel(`group-views-${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'message_views',
        }, async (payload) => {
          if (payload.new) {
            // Get updated view statistics for the message
            try {
              const enhancedMessage = await this.getEnhancedGroupMessage(payload.new.message_id);
              onViewStatusUpdate(payload.new.message_id, {
                viewed_by_count: enhancedMessage.viewed_by_count,
                pending_viewers: enhancedMessage.pending_viewers,
              });
            } catch (error) {
              console.warn('Failed to get updated message stats:', error);
            }
          }
        })
        .subscribe();

      return {
        unsubscribe: () => {
          messageSubscription.unsubscribe();
          viewSubscription.unsubscribe();
        }
      };
    } catch (error) {
      throw new DatabaseError('Failed to subscribe to group messages', error);
    }
  }

  /**
   * Update user's presence in group chat
   */
  async updateGroupChatPresence(chatId: string, isActive: boolean = true): Promise<void> {
    try {
      // Use existing presence system from disappearingMessagesService
      await disappearingMessagesService.updateChatPresence(chatId, isActive);
    } catch (error) {
      throw new DatabaseError('Failed to update group chat presence', error);
    }
  }

  /**
   * Leave group chat (triggers message cleanup if no one else is active)
   */
  async leaveGroupChat(chatId: string): Promise<void> {
    try {
      // Mark user as inactive
      await this.updateGroupChatPresence(chatId, false);
      
      // Trigger cleanup of fully-viewed messages if no one is active
      await supabase.rpc('cleanup_group_disappearing_messages', {
        p_chat_id: chatId
      });
    } catch (error) {
      throw new DatabaseError('Failed to leave group chat', error);
    }
  }
}

// Export singleton instance
export const groupMessagingService = new GroupMessagingService(); 