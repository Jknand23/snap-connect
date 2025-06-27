/**
 * Group Messaging Test
 * 
 * Test file to demonstrate and validate group messaging functionality
 * where messages disappear only after ALL group members have viewed them.
 */

import { groupMessagingService } from '../services/messaging/groupMessagingService';

/**
 * Test group messaging functionality
 */
export async function testGroupMessaging() {
  console.log('🚀 Starting Group Messaging Test...');

  try {
    // This would be a real chat ID in practice
    const testChatId = 'test-group-chat-id';

    console.log('📊 Getting group chat info...');
    const groupInfo = await groupMessagingService.getGroupChatInfo(testChatId);
    console.log(`👥 Group: ${groupInfo.name} with ${groupInfo.total_members} members`);
    console.log(`🟢 Active: ${groupInfo.active_participants.length} members`);

    console.log('\n📨 Sending test message...');
    const message = await groupMessagingService.sendGroupMessage(
      testChatId,
      'Hello everyone! This is a test ephemeral message.',
      undefined,
      'text'
    );
    console.log(`✅ Message sent: ${message.id}`);
    console.log(`👀 Viewed by: ${message.viewed_by_count}/${message.total_participants}`);
    console.log(`⏳ Pending viewers: ${message.pending_viewers.join(', ')}`);

    console.log('\n📈 Getting message statistics...');
    const stats = await groupMessagingService.getGroupMessageStats(testChatId);
    console.log(`📊 Total messages: ${stats.total_messages}`);
    console.log(`⏳ Pending disappear: ${stats.pending_disappear}`);
    console.log(`👁️ Total views: ${stats.total_views}`);

    console.log('\n✅ Group messaging test completed successfully!');

    return {
      success: true,
      groupInfo,
      message,
      stats,
    };
  } catch (error) {
    console.error('❌ Group messaging test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test real-time subscriptions
 */
export function testGroupMessagingSubscriptions(chatId: string) {
  console.log('🔄 Setting up real-time subscriptions...');

  const subscription = groupMessagingService.subscribeToGroupMessages(
    chatId,
    // New message handler
    (message) => {
      console.log(`📨 New message received: ${message.content}`);
      console.log(`👀 Viewed by: ${message.viewed_by_count}/${message.total_participants}`);
    },
    // Message disappeared handler
    (messageId) => {
      console.log(`💨 Message disappeared: ${messageId}`);
    },
    // View status update handler
    (messageId, viewStats) => {
      console.log(`👁️ View status updated for ${messageId}: ${viewStats.viewed_by_count} views`);
      console.log(`⏳ Still waiting for: ${viewStats.pending_viewers.join(', ')}`);
    }
  );

  console.log('✅ Subscriptions set up successfully');

  // Return unsubscribe function
  return subscription;
}

/**
 * Demonstrate the complete group messaging lifecycle
 */
export async function demonstrateGroupMessagingLifecycle() {
  console.log('🎭 Starting Group Messaging Lifecycle Demo...');

  try {
    const testChatId = 'demo-group-chat';

    // Step 1: Join the chat (update presence)
    console.log('\n1️⃣ Joining group chat...');
    await groupMessagingService.updateGroupChatPresence(testChatId, true);
    console.log('✅ Joined chat and marked as active');

    // Step 2: Send a message
    console.log('\n2️⃣ Sending message to group...');
    const message = await groupMessagingService.sendGroupMessage(
      testChatId,
      'This message will disappear after everyone sees it!',
      undefined,
      'text'
    );
    console.log(`✅ Message sent: "${message.content}"`);

    // Step 3: Get enhanced message details
    console.log('\n3️⃣ Getting enhanced message details...');
    const enhancedMessage = await groupMessagingService.getEnhancedGroupMessage(message.id);
    console.log(`👥 Total participants: ${enhancedMessage.total_participants}`);
    console.log(`👀 Currently viewed by: ${enhancedMessage.viewed_by_count} members`);
    console.log(`📝 Viewed by: ${enhancedMessage.viewed_by_usernames.join(', ')}`);
    console.log(`⏳ Waiting for: ${enhancedMessage.pending_viewers.join(', ')}`);
    console.log(`🎯 Can disappear: ${enhancedMessage.can_disappear ? 'Yes' : 'No'}`);

    // Step 4: Simulate marking as viewed (in real app, this happens automatically)
    console.log('\n4️⃣ Marking message as viewed...');
    await groupMessagingService.markGroupMessageAsViewed(message.id);
    console.log('✅ Message marked as viewed by current user');

    // Step 5: Leave the chat
    console.log('\n5️⃣ Leaving group chat...');
    await groupMessagingService.leaveGroupChat(testChatId);
    console.log('✅ Left chat - messages may now disappear if all members have viewed them');

    console.log('\n🎉 Group messaging lifecycle demo completed!');

    return { success: true, messageId: message.id };
  } catch (error) {
    console.error('❌ Lifecycle demo failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test group messaging edge cases
 */
export async function testGroupMessagingEdgeCases() {
  console.log('🧪 Testing Group Messaging Edge Cases...');

  const testChatId = 'edge-case-chat';

  try {
    // Test 1: Send message to non-existent group
    console.log('\n🧪 Test 1: Send to non-existent group...');
    try {
      await groupMessagingService.sendGroupMessage('non-existent-chat', 'Test message');
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent group');
    }

    // Test 2: Mark non-existent message as viewed
    console.log('\n🧪 Test 2: Mark non-existent message as viewed...');
    try {
      await groupMessagingService.markGroupMessageAsViewed('non-existent-message');
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent message');
    }

    // Test 3: Get info for non-existent group
    console.log('\n🧪 Test 3: Get info for non-existent group...');
    try {
      await groupMessagingService.getGroupChatInfo('non-existent-chat');
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent group');
    }

    console.log('\n✅ Edge case testing completed!');
    return { success: true };
  } catch (error) {
    console.error('❌ Edge case testing failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 