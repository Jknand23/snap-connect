/**
 * Debug utility for testing disappearing messages functionality
 * 
 * This file helps debug whether the disappearing messages system is working correctly.
 * Run functions from this file in the app to test different aspects of the system.
 */

import { disappearingMessagesService } from './src/services/messaging/disappearingMessagesService';
import { chatService } from './src/services/messaging/chatService';
import { supabase } from './src/services/database/supabase';

export class DisappearingMessagesDebugger {
  
  /**
   * Test if all database functions exist and are accessible
   */
  static async testDatabaseFunctions(): Promise<void> {
    console.log('🔍 Testing database functions...');
    
    try {
      // Test cleanup function
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc('cleanup_disappearing_messages');
      if (cleanupError) {
        console.error('❌ cleanup_disappearing_messages function failed:', cleanupError);
      } else {
        console.log('✅ cleanup_disappearing_messages function works');
      }

      // Test delete function
      const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_disappearing_messages');
      if (deleteError) {
        console.error('❌ delete_disappearing_messages function failed:', deleteError);
      } else {
        console.log('✅ delete_disappearing_messages function works');
      }

      // Test full cleanup
      const { data: fullResult, error: fullError } = await supabase.rpc('full_message_cleanup');
      if (fullError) {
        console.error('❌ full_message_cleanup function failed:', fullError);
      } else {
        console.log('✅ full_message_cleanup function works');
      }

    } catch (error) {
      console.error('❌ Error testing database functions:', error);
    }
  }

  /**
   * Check current disappearing messages in the database
   */
  static async checkDisappearingMessages(): Promise<void> {
    console.log('📝 Checking current disappearing messages...');
    
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          is_disappearing,
          viewed_by_recipient,
          should_disappear,
          created_at,
          chats!inner(type)
        `)
        .eq('is_disappearing', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching disappearing messages:', error);
        return;
      }

      console.log(`📊 Found ${messages?.length || 0} disappearing messages:`);
      messages?.forEach((msg: any) => {
        console.log(`- ${msg.id}: "${msg.content}" (${msg.chats.type} chat)`);
        console.log(`  Viewed: ${msg.viewed_by_recipient}, Should Disappear: ${msg.should_disappear}`);
      });

    } catch (error) {
      console.error('❌ Error checking disappearing messages:', error);
    }
  }

  /**
   * Check message views table
   */
  static async checkMessageViews(): Promise<void> {
    console.log('👁️ Checking message views...');
    
    try {
      const { data: views, error } = await supabase
        .from('message_views')
        .select(`
          *,
          messages!inner(content, sender_id)
        `)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching message views:', error);
        return;
      }

      console.log(`📊 Found ${views?.length || 0} message views:`);
      views?.forEach((view: any) => {
        console.log(`- Message: "${view.messages.content}" viewed at ${view.viewed_at}`);
      });

    } catch (error) {
      console.error('❌ Error checking message views:', error);
    }
  }

  /**
   * Check chat presence data
   */
  static async checkChatPresence(): Promise<void> {
    console.log('👥 Checking chat presence...');
    
    try {
      const { data: presence, error } = await supabase
        .from('chat_presence')
        .select(`
          *,
          profiles!inner(username)
        `)
        .order('last_activity', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching chat presence:', error);
        return;
      }

      console.log(`📊 Found ${presence?.length || 0} presence records:`);
      presence?.forEach((p: any) => {
        console.log(`- ${p.profiles.username}: ${p.is_active ? 'ACTIVE' : 'INACTIVE'} (last: ${p.last_activity})`);
      });

    } catch (error) {
      console.error('❌ Error checking chat presence:', error);
    }
  }

  /**
   * Manually trigger cleanup and observe results
   */
  static async manualCleanupTest(): Promise<void> {
    console.log('🧹 Starting manual cleanup test...');
    
    try {
      // Get count before cleanup
      const { count: beforeCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_disappearing', true)
        .eq('should_disappear', false);

      console.log(`📊 Messages before cleanup: ${beforeCount}`);

      // Trigger cleanup
      await disappearingMessagesService.triggerMessageCleanup();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get count after cleanup
      const { count: afterCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_disappearing', true)
        .eq('should_disappear', false);

      console.log(`📊 Messages after cleanup: ${afterCount}`);
      
      if (beforeCount !== null && afterCount !== null) {
        const deleted = beforeCount - afterCount;
        console.log(`💨 ${deleted} messages were processed by cleanup`);
      }

    } catch (error) {
      console.error('❌ Error during manual cleanup test:', error);
    }
  }

  /**
   * Test real-time subscriptions
   */
  static async testRealtimeSubscriptions(chatId: string): Promise<() => void> {
    console.log(`📡 Testing real-time subscriptions for chat ${chatId}...`);
    
    const subscription = disappearingMessagesService.subscribeToDisappearingMessages(
      chatId,
      (message) => {
        console.log('📨 New message received via subscription:', message.id);
      },
      (messageId) => {
        console.log('💨 Message disappeared via subscription:', messageId);
      }
    );

    console.log('✅ Subscriptions set up. Watch console for real-time events.');
    
    return () => {
      subscription.unsubscribe();
      console.log('🔌 Subscriptions unsubscribed');
    };
  }

  /**
   * Simulate a complete message lifecycle
   */
  static async simulateMessageLifecycle(chatId: string, content: string): Promise<void> {
    console.log('🔄 Simulating complete message lifecycle...');
    
    try {
      // 1. Send disappearing message
      console.log('1️⃣ Sending disappearing message...');
      const message = await chatService.sendMessage(chatId, content);
      console.log(`✅ Message sent: ${message.id}`);

      // 2. Mark as viewed (simulate recipient viewing)
      console.log('2️⃣ Marking message as viewed...');
      await chatService.markMessageAsViewed(message.id);
      console.log('✅ Message marked as viewed');

      // 3. Leave chat (simulate no one in chat)
      console.log('3️⃣ Leaving chat...');
      await chatService.leaveChat(chatId);
      console.log('✅ Left chat');

      // 4. Wait and trigger cleanup
      console.log('4️⃣ Waiting and triggering cleanup...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await disappearingMessagesService.triggerMessageCleanup();
      console.log('✅ Cleanup triggered');

      // 5. Check if message still exists
      console.log('5️⃣ Checking if message still exists...');
      const { data: messageCheck } = await supabase
        .from('messages')
        .select('id, should_disappear')
        .eq('id', message.id)
        .single();

      if (messageCheck) {
        console.log(`📝 Message still exists. should_disappear: ${messageCheck.should_disappear}`);
      } else {
        console.log('💨 Message has been deleted!');
      }

    } catch (error) {
      console.error('❌ Error during lifecycle simulation:', error);
    }
  }

  /**
   * Run all debug tests
   */
  static async runAllTests(chatId?: string): Promise<void> {
    console.log('🚀 Running all disappearing messages debug tests...\n');
    
    await this.testDatabaseFunctions();
    console.log('\n');
    
    await this.checkDisappearingMessages();
    console.log('\n');
    
    await this.checkMessageViews();
    console.log('\n');
    
    await this.checkChatPresence();
    console.log('\n');
    
    await this.manualCleanupTest();
    console.log('\n');
    
    if (chatId) {
      await this.simulateMessageLifecycle(chatId, 'Test disappearing message');
      console.log('\n');
    }
    
    console.log('✅ All debug tests completed!');
  }
}

// Export for easy access
export default DisappearingMessagesDebugger;

/**
 * Usage examples:
 * 
 * // Test database functions
 * DisappearingMessagesDebugger.testDatabaseFunctions();
 * 
 * // Check current state
 * DisappearingMessagesDebugger.checkDisappearingMessages();
 * 
 * // Manual cleanup test
 * DisappearingMessagesDebugger.manualCleanupTest();
 * 
 * // Test real-time (remember to unsubscribe)
 * const unsubscribe = await DisappearingMessagesDebugger.testRealtimeSubscriptions('chat_id');
 * // Later: unsubscribe();
 * 
 * // Simulate complete lifecycle
 * DisappearingMessagesDebugger.simulateMessageLifecycle('chat_id', 'Test message');
 * 
 * // Run all tests
 * DisappearingMessagesDebugger.runAllTests('optional_chat_id');
 */ 