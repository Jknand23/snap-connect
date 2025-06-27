/**
 * Disappearing Messages Integration Service
 * 
 * This service ensures that disappearing messages work correctly by:
 * 1. Automatically marking messages as viewed when recipients see them
 * 2. Properly tracking chat presence when users enter/leave chats
 * 3. Triggering cleanup at appropriate intervals and events
 * 4. Handling edge cases and ensuring reliable operation
 */

import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { disappearingMessagesService } from './disappearingMessagesService';
import { chatService } from './chatService';

class DisappearingMessagesIntegration {
  private cleanupInterval: number | null = null;
  private activeChatId: string | null = null;
  private presenceHeartbeat: number | null = null;

  /**
   * Initialize the integration service
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing disappearing messages integration...');
    
    // Start periodic cleanup every 30 seconds
    this.startPeriodicCleanup();
    
    console.log('✅ Disappearing messages integration initialized');
  }

  /**
   * Enter a chat properly (handle presence and auto-viewing)
   */
  async enterChat(chatId: string): Promise<void> {
    try {
      console.log('👋 [Integration] Entering chat:', chatId);
      
      // Leave previous chat if any
      if (this.activeChatId && this.activeChatId !== chatId) {
        await this.leaveChat(this.activeChatId);
      }
      
      this.activeChatId = chatId;
      
      // Mark presence as active
      await chatService.enterChat(chatId);
      
      // Start presence heartbeat (update presence every 15 seconds)
      this.startPresenceHeartbeat(chatId);
      
      // Auto-mark unviewed messages as viewed
      await this.autoMarkUnviewedMessages(chatId);
      
      console.log('✅ [Integration] Successfully entered chat');
      
    } catch (error) {
      console.error('❌ [Integration] Failed to enter chat:', error);
      throw error;
    }
  }

  /**
   * Leave a chat properly (handle presence and trigger cleanup)
   */
  async leaveChat(chatId?: string): Promise<void> {
    try {
      const targetChatId = chatId || this.activeChatId;
      if (!targetChatId) return;
      
      console.log('👋 [Integration] Leaving chat:', targetChatId);
      
      // Stop presence heartbeat
      this.stopPresenceHeartbeat();
      
      // Mark presence as inactive and trigger cleanup
      await chatService.leaveChat(targetChatId);
      
      if (targetChatId === this.activeChatId) {
        this.activeChatId = null;
      }
      
      // Force an immediate cleanup attempt
      setTimeout(() => {
        this.triggerCleanup();
      }, 2000); // Small delay to ensure presence is updated
      
      console.log('✅ [Integration] Successfully left chat');
      
    } catch (error) {
      console.error('❌ [Integration] Failed to leave chat:', error);
    }
  }

  /**
   * Mark a message as viewed with proper integration
   */
  async markMessageAsViewed(messageId: string): Promise<void> {
    try {
      console.log('👁️ [Integration] Marking message as viewed:', messageId);
      
      await chatService.markMessageAsViewed(messageId);
      
      // Check if this creates a cleanup opportunity
      setTimeout(() => {
        this.triggerCleanup();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [Integration] Failed to mark message as viewed:', error);
      throw error;
    }
  }

  /**
   * Auto-mark all unviewed messages in a chat as viewed
   */
  private async autoMarkUnviewedMessages(chatId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();
      
      // Get all disappearing messages from other users that haven't been viewed yet
      const { data: unviewedMessages, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          is_disappearing,
          message_views!left(viewer_id)
        `)
        .eq('chat_id', chatId)
        .eq('is_disappearing', true)
        .neq('sender_id', userId)
        .is('message_views.viewer_id', null); // Not viewed by current user
      
      if (error) {
        console.warn('Failed to query unviewed messages:', error);
        return;
      }
      
      if (unviewedMessages && unviewedMessages.length > 0) {
        console.log(`👁️ [Integration] Auto-marking ${unviewedMessages.length} unviewed messages`);
        
        for (const message of unviewedMessages) {
          try {
            await this.markMessageAsViewed(message.id);
          } catch (error) {
            console.warn('Failed to auto-mark message as viewed:', message.id, error);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ [Integration] Failed to auto-mark unviewed messages:', error);
    }
  }

  /**
   * Start presence heartbeat to keep presence active
   */
  private startPresenceHeartbeat(chatId: string): void {
    this.stopPresenceHeartbeat(); // Clear any existing heartbeat
    
    this.presenceHeartbeat = setInterval(async () => {
      try {
        await disappearingMessagesService.updateChatPresence(chatId, true);
        console.log('💓 [Integration] Presence heartbeat sent for chat:', chatId);
      } catch (error) {
        console.warn('Failed to send presence heartbeat:', error);
      }
    }, 15000); // Every 15 seconds
  }

  /**
   * Stop presence heartbeat
   */
  private stopPresenceHeartbeat(): void {
    if (this.presenceHeartbeat) {
      clearInterval(this.presenceHeartbeat);
      this.presenceHeartbeat = null;
    }
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.triggerCleanup();
    }, 30000); // Every 30 seconds
  }

  /**
   * Trigger cleanup with proper error handling
   */
  private async triggerCleanup(): Promise<void> {
    try {
      console.log('🧹 [Integration] Triggering message cleanup...');
      await disappearingMessagesService.triggerMessageCleanup();
      console.log('✅ [Integration] Cleanup completed');
    } catch (error) {
      console.warn('⚠️ [Integration] Cleanup failed:', error);
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔧 [Integration] Shutting down...');
    
    // Leave current chat if any
    if (this.activeChatId) {
      await this.leaveChat(this.activeChatId);
    }
    
    // Stop all intervals
    this.stopPresenceHeartbeat();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    console.log('✅ [Integration] Shutdown complete');
  }

  /**
   * Get current active chat
   */
  getActiveChatId(): string | null {
    return this.activeChatId;
  }

  /**
   * Manual cleanup trigger for testing
   */
  async manualCleanup(): Promise<void> {
    console.log('🧪 [Integration] Manual cleanup triggered');
    await this.triggerCleanup();
  }

  /**
   * Debug: Get integration status
   */
  getStatus(): {
    activeChatId: string | null;
    hasPresenceHeartbeat: boolean;
    hasCleanupInterval: boolean;
  } {
    return {
      activeChatId: this.activeChatId,
      hasPresenceHeartbeat: this.presenceHeartbeat !== null,
      hasCleanupInterval: this.cleanupInterval !== null,
    };
  }
}

// Create and export singleton instance
export const disappearingMessagesIntegration = new DisappearingMessagesIntegration();
export default disappearingMessagesIntegration; 