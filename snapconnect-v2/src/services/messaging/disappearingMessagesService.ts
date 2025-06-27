/**
 * Disappearing Messages Service
 * 
 * Handles sophisticated disappearing message functionality where messages
 * disappear after being viewed by the recipient AND when no one is active in the chat.
 * Senders can view their own messages multiple times before recipient sees them.
 * Only applies to direct chats, not group or community chats.
 */

import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageView = Database['public']['Tables']['message_views']['Row'];
type ChatPresence = Database['public']['Tables']['chat_presence']['Row'];

// Global type extension for message deletion events
declare global {
  var __messageDelections: Array<{
    messageId: string;
    chatId: string;
    timestamp: number;
  }> | undefined;
}

export interface EnhancedMessage extends Message {
  sender_username?: string;
  is_viewed_by_me?: boolean;
  is_viewed_by_recipient?: boolean;
  can_be_viewed?: boolean;
  sender_profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface MessageViewStatus {
  messageId: string;
  isViewed: boolean;
  viewedAt?: string;
  canStillView: boolean;
  shouldDisappear: boolean;
}

export interface ChatPresenceInfo {
  userId: string;
  isActive: boolean;
  lastActivity: string;
  username?: string;
}

/**
 * Service for managing disappearing messages with sophisticated view tracking
 */
export class DisappearingMessagesService {
  
  /**
   * Mark a message as viewed by the current user
   */
  async markMessageAsViewed(messageId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();
      
      // Call the database function to handle view logic
      const { error } = await supabase.rpc('mark_message_viewed', {
        p_message_id: messageId,
        p_viewer_id: userId
      });

      if (error) {
        throw new DatabaseError('Failed to mark message as viewed', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to mark message as viewed', error);
    }
  }

  /**
   * Update user's presence in a chat
   */
  async updateChatPresence(chatId: string, isActive: boolean = true): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();
      
      const { error } = await supabase.rpc('update_chat_presence', {
        p_chat_id: chatId,
        p_user_id: userId,
        p_is_active: isActive
      });

      if (error) {
        throw new DatabaseError('Failed to update chat presence', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to update chat presence', error);
    }
  }

  /**
   * Get enhanced messages for a chat with view status
   */
  async getEnhancedChatMessages(chatId: string, limit = 50, before?: string): Promise<EnhancedMessage[]> {
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
        throw new DatabaseError('Not authorized to view chat messages');
      }

      // Get messages with enhanced information
      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(username, avatar_url),
          message_views!left(viewer_id, viewed_at)
        `)
        .eq('chat_id', chatId)
        .eq('should_disappear', false) // Only show messages that haven't been marked for deletion
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get enhanced chat messages', error);
      }

      // Enhance messages with additional information
      const enhancedMessages: EnhancedMessage[] = (messages || []).map((message: any) => {
        const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
        const userView = message.message_views?.find((v: any) => v.viewer_id === userId);
        const isOwnMessage = message.sender_id === userId;
        
        return {
          ...message,
          sender_username: profile?.username || 'Unknown',
          sender_profile: profile,
          is_viewed_by_me: !!userView,
          is_viewed_by_recipient: message.viewed_by_recipient,
          can_be_viewed: isOwnMessage || !message.should_disappear,
        };
      });

      return enhancedMessages.reverse(); // Return in chronological order
    } catch (error) {
      throw new DatabaseError('Failed to get enhanced chat messages', error);
    }
  }

  /**
   * Send a disappearing message (default for direct chats)
   */
  async sendDisappearingMessage(
    chatId: string,
    content?: string,
    mediaUrl?: string,
    mediaType: 'text' | 'photo' | 'video' | 'story_share' = 'text'
  ): Promise<EnhancedMessage> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant in chat
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to send message to this chat');
      }

      // Check if this is a direct chat
      const { data: chat } = await supabase
        .from('chats')
        .select('type')
        .eq('id', chatId)
        .single();

      const isDirectChat = chat?.type === 'direct';

      const insertData: MessageInsert = {
        chat_id: chatId,
        sender_id: userId,
        content: content || null,
        media_url: mediaUrl || null,
        media_type: mediaType,
        is_disappearing: isDirectChat, // Only direct chats have disappearing messages
        viewed_by_recipient: false,
        should_disappear: false,
      };

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(insertData)
        .select(`*`)
        .single();

      if (messageError) {
        throw new DatabaseError('Failed to send disappearing message', messageError);
      }

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      // Get sender profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();

      return {
        ...message,
        sender_username: profile?.username || 'Unknown',
        sender_profile: profile,
        is_viewed_by_me: false,
        is_viewed_by_recipient: false,
        can_be_viewed: true,
      };
    } catch (error) {
      throw new DatabaseError('Failed to send disappearing message', error);
    }
  }

  /**
   * Get current presence information for a chat
   */
  async getChatPresence(chatId: string): Promise<ChatPresenceInfo[]> {
    try {
      const { data: presence, error } = await supabase
        .from('chat_presence')
        .select(`
          *,
          profiles!inner(username)
        `)
        .eq('chat_id', chatId)
        .eq('is_active', true)
        .gt('last_activity', new Date(Date.now() - 30 * 1000).toISOString()); // Active in last 30 seconds

      if (error) {
        throw new DatabaseError('Failed to get chat presence', error);
      }

      return (presence || []).map((p: any) => ({
        userId: p.user_id,
        isActive: p.is_active,
        lastActivity: p.last_activity,
        username: p.profiles?.username || 'Unknown',
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get chat presence', error);
    }
  }

  /**
   * Leave a chat (mark presence as inactive)
   */
  async leaveChatPresence(chatId: string): Promise<void> {
    try {
      await this.updateChatPresence(chatId, false);
      
      // Trigger cleanup after a longer delay to ensure all users have left
      setTimeout(async () => {
        await this.triggerMessageCleanup();
      }, 10000); // 10 second delay to ensure no one is coming back
    } catch (error) {
      throw new DatabaseError('Failed to leave chat presence', error);
    }
  }

  /**
   * Manually trigger message cleanup (only when no active users)
   */
  async triggerMessageCleanup(): Promise<void> {
    try {
      console.log('🧹 Starting conservative message cleanup...');
      
      // Step 1: Get messages that will be deleted BEFORE cleanup
      const { data: messagesToDelete, error: queryError } = await supabase
        .from('messages')
        .select('id, chat_id')
        .eq('is_disappearing', true)
        .eq('viewed_by_recipient', true)
        .eq('should_disappear', false);
      
      if (queryError) {
        console.warn('Failed to query messages for cleanup:', queryError);
        return;
      }

      // Step 2: Filter messages where no users are active in the chat
      const eligibleMessages = [];
      if (messagesToDelete) {
        for (const message of messagesToDelete) {
          const { data: activeUsers } = await supabase
            .from('chat_presence')
            .select('user_id')
            .eq('chat_id', message.chat_id)
            .eq('is_active', true);
          
          if (!activeUsers || activeUsers.length === 0) {
            eligibleMessages.push(message);
          }
        }
      }

      console.log(`🧹 Found ${eligibleMessages.length} messages eligible for deletion`);

      // Step 3: Run the cleanup functions
      const { data: result, error: fullCleanupError } = await supabase.rpc('full_message_cleanup');
      
      if (fullCleanupError) {
        console.warn('Failed to run full message cleanup:', fullCleanupError);
        
        // Fallback to individual functions
        console.log('Trying individual cleanup functions...');
        
        // Mark messages for deletion (this function checks for active users)
        const { error: cleanupError } = await supabase.rpc('cleanup_disappearing_messages');
        if (cleanupError) {
          console.warn('Failed to cleanup disappearing messages:', cleanupError);
          return;
        }

        // Actually delete marked messages
        const { error: deleteError } = await supabase.rpc('delete_disappearing_messages');
        if (deleteError) {
          console.warn('Failed to delete disappearing messages:', deleteError);
          return;
        }
        
        console.log('✅ Individual cleanup functions completed');
      } else {
        console.log('✅ Full cleanup completed:', result);
      }

      // Step 4: Manually trigger UI updates for deleted messages
      // Since real-time DELETE events may not fire from database functions,
      // we'll manually notify all active subscriptions
      for (const message of eligibleMessages) {
        console.log('🔄 Manually triggering deletion event for message:', message.id);
        this.notifyMessageDeletion(message.id, message.chat_id);
      }
      
    } catch (error) {
      console.warn('Failed to trigger message cleanup:', error);
    }
  }

  // Store active deletion callbacks for manual notifications
  private deletionCallbacks: Map<string, (messageId: string) => void> = new Map();

  /**
   * Register a deletion callback for a specific chat
   */
  registerDeletionCallback(chatId: string, callback: (messageId: string) => void): void {
    console.log('📋 Registering deletion callback for chat:', chatId);
    this.deletionCallbacks.set(chatId, callback);
  }

  /**
   * Unregister a deletion callback for a specific chat
   */
  unregisterDeletionCallback(chatId: string): void {
    console.log('📋 Unregistering deletion callback for chat:', chatId);
    this.deletionCallbacks.delete(chatId);
  }

  /**
   * Manually notify subscribers about message deletion
   * This is a fallback when real-time events don't fire from database functions
   */
  private notifyMessageDeletion(messageId: string, chatId: string): void {
    console.log('📢 Broadcasting manual deletion event for message:', messageId, 'in chat:', chatId);
    
    // Call the registered callback for this chat
    const callback = this.deletionCallbacks.get(chatId);
    if (callback) {
      console.log('📢 Calling registered deletion callback for chat:', chatId);
      callback(messageId);
    } else {
      console.log('📢 No deletion callback registered for chat:', chatId);
      console.log('📢 Available callbacks for chats:', Array.from(this.deletionCallbacks.keys()));
      
      // Fallback: Try to trigger a global event that any active ChatScreen can pick up
      // This ensures UI updates even if the specific callback isn't registered
      console.log('📢 Attempting global message deletion notification');
      this.broadcastGlobalDeletion(messageId, chatId);
    }
  }

  /**
   * Global deletion broadcast for when specific callbacks aren't available
   */
  private broadcastGlobalDeletion(messageId: string, chatId: string): void {
    // Store the deletion event for any ChatScreen that might be listening
    const deletionEvent = { messageId, chatId, timestamp: Date.now() };
    
    // Use a simple global state approach
    if (typeof global !== 'undefined') {
      if (!global.__messageDelections) {
        global.__messageDelections = [];
      }
      global.__messageDelections.push(deletionEvent);
      
      // Clean up old events (keep only last 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      global.__messageDelections = global.__messageDelections.filter(
        (event: any) => event.timestamp > tenMinutesAgo
      );
      
      console.log('📢 Added deletion event to global queue:', deletionEvent);
    }
  }

  /**
   * Check for pending deletion events for a specific chat
   */
  checkPendingDeletions(chatId: string, callback: (messageId: string) => void): void {
    if (typeof global !== 'undefined' && global.__messageDelections) {
      const relevantDeletions = global.__messageDelections.filter(
        (event: any) => event.chatId === chatId
      );
      
      for (const deletion of relevantDeletions) {
        console.log('📢 Processing pending deletion:', deletion.messageId);
        callback(deletion.messageId);
      }
      
      // Remove processed deletions
      global.__messageDelections = global.__messageDelections.filter(
        (event: any) => event.chatId !== chatId
      );
    }
  }

  /**
   * Get view status for a specific message
   */
  async getMessageViewStatus(messageId: string): Promise<MessageViewStatus | null> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        return null;
      }

      const { data: view } = await supabase
        .from('message_views')
        .select('*')
        .eq('message_id', messageId)
        .eq('viewer_id', userId)
        .single();

      const isOwnMessage = message.sender_id === userId;

      return {
        messageId: messageId,
        isViewed: !!view,
        viewedAt: view?.viewed_at,
        canStillView: isOwnMessage || !message.should_disappear,
        shouldDisappear: message.should_disappear,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get message view status', error);
    }
  }

  /**
   * Subscribe to real-time message updates including disappearing status
   */
  subscribeToDisappearingMessages(
    chatId: string, 
    onMessage: (message: EnhancedMessage) => void,
    onMessageDisappeared: (messageId: string) => void
  ) {
    console.log('🔄 subscribeToDisappearingMessages called for chat:', chatId);
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log('📨 Real-time INSERT detected:', payload);
          try {
            // Get enhanced message data
            const messages = await this.getEnhancedChatMessages(chatId, 1);
            const newMessage = messages.find(m => m.id === payload.new.id);
            if (newMessage) {
              console.log('📨 Calling onMessage with:', newMessage.id);
              onMessage(newMessage);
            }
          } catch (error) {
            console.error('Error processing new message:', error);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📨 Message subscription status:', status);
        if (err) console.error('📨 Message subscription error:', err);
      });

    // Subscribe to message deletions (disappearing messages)
    const deletionSubscription = supabase
      .channel(`chat-deletions-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('💨 Real-time deletion detected for chat:', chatId);
          console.log('💨 Deleted message payload:', payload);
          console.log('💨 Deleted message ID:', payload.old?.id);
          if (payload.old?.id) {
            onMessageDisappeared(payload.old.id);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('💨 Deletion subscription status:', status);
        if (err) console.error('💨 Deletion subscription error:', err);
      });
    
    console.log('🔄 Deletion subscription created for chat:', chatId);

    return {
      unsubscribe: () => {
        messageSubscription.unsubscribe();
        deletionSubscription.unsubscribe();
      }
    };
  }

  /**
   * Get statistics about disappearing messages in a chat
   */
  async getDisappearingMessageStats(chatId: string): Promise<{
    totalMessages: number;
    disappearingMessages: number;
    viewedByRecipient: number;
    pendingDeletion: number;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('messages')
        .select('is_disappearing, viewed_by_recipient, should_disappear')
        .eq('chat_id', chatId);

      if (error) {
        throw new DatabaseError('Failed to get message stats', error);
      }

      const totalMessages = stats?.length || 0;
      const disappearingMessages = stats?.filter(m => m.is_disappearing).length || 0;
      const viewedByRecipient = stats?.filter(m => m.viewed_by_recipient).length || 0;
      const pendingDeletion = stats?.filter(m => m.should_disappear).length || 0;

      return {
        totalMessages,
        disappearingMessages,
        viewedByRecipient,
        pendingDeletion,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get disappearing message stats', error);
    }
  }
}

// Export singleton instance
export const disappearingMessagesService = new DisappearingMessagesService(); 