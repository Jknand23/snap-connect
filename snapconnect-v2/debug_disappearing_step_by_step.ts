/**
 * Step-by-Step Debugging for Disappearing Messages
 * 
 * This utility will help us identify exactly why messages aren't disappearing
 * and provide detailed logging to fix the issue.
 */

import { supabase } from './src/services/database/supabase';
import { disappearingMessagesService } from './src/services/messaging/disappearingMessagesService';
import { chatService } from './src/services/messaging/chatService';

export class DisappearingMessagesStepByStepDebugger {
  
  /**
   * Step 1: Check if database functions exist and work
   */
  static async step1_checkDatabaseFunctions(): Promise<void> {
    console.log('🔍 STEP 1: Checking database functions...');
    
    try {
      // Test each function individually
      console.log('Testing cleanup_disappearing_messages...');
      const { data: cleanupData, error: cleanupError } = await supabase.rpc('cleanup_disappearing_messages');
      if (cleanupError) {
        console.error('❌ cleanup_disappearing_messages FAILED:', cleanupError);
      } else {
        console.log('✅ cleanup_disappearing_messages works');
      }

      console.log('Testing delete_disappearing_messages...');
      const { data: deleteData, error: deleteError } = await supabase.rpc('delete_disappearing_messages');
      if (deleteError) {
        console.error('❌ delete_disappearing_messages FAILED:', deleteError);
      } else {
        console.log('✅ delete_disappearing_messages works');
      }

      console.log('Testing full_message_cleanup...');
      const { data: fullData, error: fullError } = await supabase.rpc('full_message_cleanup');
      if (fullError) {
        console.error('❌ full_message_cleanup FAILED:', fullError);
      } else {
        console.log('✅ full_message_cleanup works:', fullData);
      }

    } catch (error) {
      console.error('❌ Database function test failed:', error);
    }
  }

  /**
   * Step 2: Check current state of disappearing messages
   */
  static async step2_checkCurrentMessages(): Promise<void> {
    console.log('\n📝 STEP 2: Checking current disappearing messages...');
    
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          is_disappearing,
          viewed_by_recipient,
          should_disappear,
          created_at,
          chats!inner(id, type)
        `)
        .eq('is_disappearing', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log(`📊 Found ${messages?.length || 0} disappearing messages:`);
      messages?.forEach((msg: any, index: number) => {
        console.log(`${index + 1}. Message ID: ${msg.id}`);
        console.log(`   Content: "${msg.content}"`);
        console.log(`   Chat Type: ${(msg.chats as any).type}`);
        console.log(`   Viewed by Recipient: ${msg.viewed_by_recipient}`);
        console.log(`   Should Disappear: ${msg.should_disappear}`);
        console.log(`   Created: ${msg.created_at}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error checking messages:', error);
    }
  }

  /**
   * Step 3: Check chat presence data
   */
  static async step3_checkChatPresence(): Promise<void> {
    console.log('\n👥 STEP 3: Checking chat presence...');
    
    try {
      const { data: presence, error } = await supabase
        .from('chat_presence')
        .select(`
          chat_id,
          user_id,
          is_active,
          last_activity,
          profiles!inner(username)
        `)
        .order('last_activity', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching presence:', error);
        return;
      }

      console.log(`📊 Found ${presence?.length || 0} presence records:`);
      presence?.forEach((p: any, index: number) => {
        console.log(`${index + 1}. User: ${p.profiles.username}`);
        console.log(`   Chat ID: ${p.chat_id}`);
        console.log(`   Active: ${p.is_active ? 'YES' : 'NO'}`);
        console.log(`   Last Activity: ${p.last_activity}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error checking presence:', error);
    }
  }

  /**
   * Step 4: Test the complete flow with a specific message
   */
  static async step4_testCompleteFlow(chatId: string, messageContent: string): Promise<void> {
    console.log('\n🔄 STEP 4: Testing complete message flow...');
    
    try {
      // 1. Send a disappearing message
      console.log('1️⃣ Sending disappearing message...');
      const message = await chatService.sendMessage(chatId, messageContent);
      console.log(`✅ Message sent: ${message.id}`);
      console.log(`   Is Disappearing: ${message.is_disappearing}`);

      // 2. Check initial state
      await this.checkSpecificMessage(message.id, 'After sending');

      // 3. Mark as viewed
      console.log('2️⃣ Marking message as viewed...');
      await chatService.markMessageAsViewed(message.id);
      console.log('✅ Message marked as viewed');

      // 4. Check state after viewing
      await this.checkSpecificMessage(message.id, 'After viewing');

      // 5. Leave chat (both users)
      console.log('3️⃣ Leaving chat...');
      await chatService.leaveChat(chatId);
      console.log('✅ Left chat');

      // 6. Check presence after leaving
      await this.checkChatPresenceForChat(chatId, 'After leaving');

      // 7. Trigger cleanup
      console.log('4️⃣ Triggering cleanup...');
      await disappearingMessagesService.triggerMessageCleanup();
      console.log('✅ Cleanup triggered');

      // 8. Check final state
      await this.checkSpecificMessage(message.id, 'After cleanup');

    } catch (error) {
      console.error('❌ Error during complete flow test:', error);
    }
  }

  /**
   * Helper: Check specific message state
   */
  static async checkSpecificMessage(messageId: string, stage: string): Promise<void> {
    console.log(`\n📋 Checking message ${messageId} - ${stage}:`);
    
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          is_disappearing,
          viewed_by_recipient,
          should_disappear,
          chats!inner(type)
        `)
        .eq('id', messageId)
        .single();

      if (error) {
        console.log(`❌ Message not found (might be deleted): ${error.message}`);
        return;
      }

      if (message) {
        console.log(`   Content: "${message.content}"`);
        console.log(`   Chat Type: ${(message.chats as any).type}`);
        console.log(`   Is Disappearing: ${message.is_disappearing}`);
        console.log(`   Viewed by Recipient: ${message.viewed_by_recipient}`);
        console.log(`   Should Disappear: ${message.should_disappear}`);
      }

    } catch (error) {
      console.error(`❌ Error checking message: ${error}`);
    }
  }

  /**
   * Helper: Check chat presence for specific chat
   */
  static async checkChatPresenceForChat(chatId: string, stage: string): Promise<void> {
    console.log(`\n👥 Checking presence for chat ${chatId} - ${stage}:`);
    
    try {
      const { data: presence, error } = await supabase
        .from('chat_presence')
        .select(`
          user_id,
          is_active,
          last_activity,
          profiles!inner(username)
        `)
        .eq('chat_id', chatId);

      if (error) {
        console.error('❌ Error fetching presence:', error);
        return;
      }

      if (presence && presence.length > 0) {
        presence.forEach((p: any) => {
          console.log(`   ${p.profiles.username}: ${p.is_active ? 'ACTIVE' : 'INACTIVE'} (${p.last_activity})`);
        });
      } else {
        console.log('   No presence records found');
      }

    } catch (error) {
      console.error(`❌ Error checking presence: ${error}`);
    }
  }

  /**
   * Step 5: Manual cleanup test with detailed logging
   */
  static async step5_manualCleanupWithLogging(): Promise<void> {
    console.log('\n🧹 STEP 5: Manual cleanup with detailed logging...');
    
    try {
      // Check eligible messages before cleanup
      const { data: eligibleMessages, error: eligibleError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          chat_id,
          is_disappearing,
          viewed_by_recipient,
          should_disappear,
          chats!inner(type)
        `)
        .eq('is_disappearing', true)
        .eq('viewed_by_recipient', true)
        .eq('should_disappear', false);

      if (eligibleError) {
        console.error('❌ Error fetching eligible messages:', eligibleError);
        return;
      }

      console.log(`📊 Found ${eligibleMessages?.length || 0} eligible messages for cleanup:`);
      
      for (const msg of eligibleMessages || []) {
        console.log(`\n🔍 Checking message ${msg.id}:`);
                 console.log(`   Content: "${msg.content}"`);
         console.log(`   Chat Type: ${(msg.chats as any).type}`);
        
        // Check if chat has active users
        const { data: activeUsers, error: activeError } = await supabase
          .from('chat_presence')
          .select('user_id, is_active, profiles!inner(username)')
          .eq('chat_id', msg.chat_id)
          .eq('is_active', true);

        if (activeError) {
          console.error('   ❌ Error checking active users:', activeError);
          continue;
        }

        if (activeUsers && activeUsers.length > 0) {
          console.log(`   🚫 ${activeUsers.length} active users - message will NOT be deleted:`);
          activeUsers.forEach((user: any) => {
            console.log(`      - ${user.profiles.username} (active)`);
          });
        } else {
          console.log('   ✅ No active users - message SHOULD be deleted');
        }
      }

      // Now run the cleanup
      console.log('\n🧹 Running cleanup...');
      const result = await supabase.rpc('full_message_cleanup');
      console.log('✅ Cleanup result:', result.data);

    } catch (error) {
      console.error('❌ Error during manual cleanup:', error);
    }
  }

  /**
   * Run all debugging steps
   */
  static async runFullDebug(chatId?: string): Promise<void> {
    console.log('🚀 Starting comprehensive disappearing messages debug...\n');
    
    await this.step1_checkDatabaseFunctions();
    await this.step2_checkCurrentMessages();
    await this.step3_checkChatPresence();
    
    if (chatId) {
      await this.step4_testCompleteFlow(chatId, 'Debug test message');
    }
    
    await this.step5_manualCleanupWithLogging();
    
    console.log('\n✅ Full debug completed! Check the logs above to identify the issue.');
  }

  /**
   * Quick test - just send, view, leave, and cleanup
   */
  static async quickTest(chatId: string): Promise<void> {
    console.log('⚡ Quick disappearing message test...\n');
    
    try {
      // Send message
      const message = await chatService.sendMessage(chatId, 'Quick test message');
      console.log(`📨 Sent message: ${message.id}`);
      
      // Mark as viewed
      await chatService.markMessageAsViewed(message.id);
      console.log('👁️ Marked as viewed');
      
      // Leave chat
      await chatService.leaveChat(chatId);
      console.log('🚪 Left chat');
      
      // Cleanup
      await disappearingMessagesService.triggerMessageCleanup();
      console.log('🧹 Triggered cleanup');
      
      // Check if message still exists
      const { data: messageCheck } = await supabase
        .from('messages')
        .select('id, should_disappear')
        .eq('id', message.id)
        .single();

      if (messageCheck) {
        console.log(`📝 Message still exists. should_disappear: ${messageCheck.should_disappear}`);
        if (messageCheck.should_disappear) {
          console.log('⚠️ Message marked for deletion but not deleted yet');
        } else {
          console.log('❌ Message NOT marked for deletion - check presence logic');
        }
      } else {
        console.log('💨 SUCCESS! Message has been deleted!');
      }

    } catch (error) {
      console.error('❌ Quick test failed:', error);
    }
  }
}

export default DisappearingMessagesStepByStepDebugger;

/**
 * Usage:
 * 
 * // Full comprehensive debug
 * DisappearingMessagesStepByStepDebugger.runFullDebug('your_chat_id');
 * 
 * // Quick test
 * DisappearingMessagesStepByStepDebugger.quickTest('your_chat_id');
 * 
 * // Individual steps
 * DisappearingMessagesStepByStepDebugger.step1_checkDatabaseFunctions();
 * DisappearingMessagesStepByStepDebugger.step2_checkCurrentMessages();
 */ 