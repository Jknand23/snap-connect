/**
 * Chat Screen Component
 * 
 * Direct messaging interface between friends with real-time messaging,
 * sports-themed design, disappearing messages, and seamless conversation flow.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../../stores/authStore';
import { chatService, ChatMessage, Chat } from '../../services/messaging/chatService';
import { disappearingMessagesService } from '../../services/messaging/disappearingMessagesService';
import { MessagesStackParamList } from '../../app/navigation/MainNavigator';
import { supabase } from '../../services/database/supabase';
import { disappearingMessagesIntegration } from '../../services/messaging/disappearingMessagesIntegration';
import { useAuth } from '../../stores/authStore';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';

type ChatScreenRouteProp = RouteProp<MessagesStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<MessagesStackParamList, 'Chat'>;

export function ChatScreen() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { friendId, friendUsername, chatId: initialChatId } = route.params;

  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  /**
   * Trigger periodic cleanup for disappearing messages
   */
  const triggerCleanup = useCallback(async () => {
    try {
      await disappearingMessagesService.triggerMessageCleanup();
      console.log('🧹 Message cleanup triggered');
    } catch (error) {
      console.warn('Failed to trigger cleanup:', error);
    }
  }, []);

  /**
   * Handle message disappearing (remove from UI)
   */
  const handleMessageDisappeared = useCallback((messageId: string) => {
    console.log('💨 Message disappeared:', messageId);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  /**
   * Handle screen focus/blur for presence tracking
   */
  useFocusEffect(
    useCallback(() => {
      // Enter chat when screen is focused
      if (chatId) {
        chatService.enterChat(chatId);
      }

      // Leave chat when screen is blurred
      return () => {
        if (chatId) {
          chatService.leaveChat(chatId);
          
          // Stop periodic cleanup
          if (cleanupIntervalRef.current) {
            clearInterval(cleanupIntervalRef.current);
            cleanupIntervalRef.current = null;
          }
          
          // Trigger cleanup when leaving to clean up viewed messages
          setTimeout(triggerCleanup, 2000); // Delay to allow presence update
        }
      };
    }, [chatId, triggerCleanup])
  );

  /**
   * Initialize chat and load messages
   */
  const initializeChat = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get or create chat
      const chatIdResult = initialChatId || await chatService.getOrCreateDirectChat(friendId);
      setChatId(chatIdResult);

      // Load chat details and messages
      const [chatDetails, chatMessages] = await Promise.all([
        chatService.getChatDetails(chatIdResult),
        chatService.getChatMessages(chatIdResult),
      ]);

      setChat(chatDetails);
      setMessages(chatMessages);

      // Mark presence as active
      await chatService.enterChat(chatIdResult);
      
      // Trigger initial cleanup to remove any eligible messages
      setTimeout(triggerCleanup, 1000);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, friendId, initialChatId, triggerCleanup]);

  /**
   * Send a message
   */
  const sendMessage = async () => {
    if (!chatId || !newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const message = await chatService.sendMessage(chatId, newMessage.trim());
      setNewMessage('');
      
      // Add message to local state immediately for instant feedback
      setMessages(prev => [...prev, message]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle message view using integration service
   */
  const handleMessageView = useCallback(async (message: ChatMessage) => {
    if (!user || message.sender_id === user.id) return; // Don't mark own messages as viewed

    // Only mark direct chat messages as viewed
    if (chat?.type === 'direct' && message.is_disappearing && !message.is_viewed_by_me) {
      try {
        await disappearingMessagesIntegration.markMessageAsViewed(message.id);
        
        // Update the message state to reflect it's been viewed
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, is_viewed_by_me: true }
            : msg
        ));
      } catch (error) {
        console.error('Error marking message as viewed:', error);
      }
    }
  }, [user, chat?.type]);

  /**
   * Handle entering chat using integration service
   */
  const handleEnterChat = useCallback(async () => {
    if (!chatId || !user?.id) return;
    
    try {
      await disappearingMessagesIntegration.enterChat(chatId);
    } catch (error) {
      console.error('❌ Failed to handle entering chat:', error);
    }
  }, [chatId, user?.id]);

  /**
   * Handle leaving chat using integration service
   */
  const handleLeaveChat = useCallback(async () => {
    if (!chatId || !user?.id) return;
    
    try {
      await disappearingMessagesIntegration.leaveChat(chatId);
    } catch (error) {
      console.error('❌ Failed to handle leaving chat:', error);
    }
  }, [chatId, user?.id]);

  /**
   * Initialize chat on component mount
   */
  useEffect(() => {
    initializeChat();
    
    // Enter chat when component mounts
    handleEnterChat();
    
    // Leave chat when component unmounts
    return () => {
      handleLeaveChat();
    };
  }, [initializeChat, handleEnterChat, handleLeaveChat]);

  /**
   * Real-time subscription and auto-viewing
   */
  useEffect(() => {
    if (!chatId || !user) return;

    console.log('🔄 Setting up real-time subscriptions for chat:', chatId);

    const subscription = disappearingMessagesService.subscribeToDisappearingMessages(
      chatId,
      (message) => {
        console.log('📨 New message received in ChatScreen:', message.id);
        
        // Convert EnhancedMessage to ChatMessage format
        const chatMessage: ChatMessage = {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          media_url: message.media_url,
          media_type: message.media_type,
          created_at: message.created_at,
          sender_username: message.sender_username || 'Unknown',
          is_disappearing: message.is_disappearing,
          viewed_by_recipient: message.viewed_by_recipient,
          viewed_at: message.viewed_at,
          should_disappear: message.should_disappear,
          is_viewed_by_me: message.is_viewed_by_me,
          can_be_viewed: message.can_be_viewed,
        };
        
        // Update messages state
        setMessages(prev => {
          const exists = prev.some(m => m.id === chatMessage.id);
          if (exists) return prev;
          
          const newMessages = [...prev, chatMessage];
          return newMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        
        // Auto-mark received messages as viewed if user is in chat
        if (chatMessage.sender_id !== user?.id) {
          setTimeout(() => {
            handleMessageView(chatMessage);
          }, 1000); // Small delay to ensure message is visible
        }
        
        // Scroll to bottom when receiving new messages
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (messageId) => {
        console.log('💨 Message deletion detected in ChatScreen:', messageId);
        handleMessageDisappeared(messageId);
      }
    );

    // Clean up on unmount
    return () => {
      console.log('🔄 Unsubscribing from real-time subscriptions for chat:', chatId);
      subscription.unsubscribe();
    };
  }, [chatId, user?.id, handleMessageView, handleMessageDisappeared]);

  /**
   * Cleanup interval on unmount
   */
  useEffect(() => {
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  /**
   * Format message timestamp
   */
  function formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get display name for chat
   */
  function getChatDisplayName(): string {
    if (chat?.other_user?.username) {
      return chat.other_user.username;
    }
    return friendUsername || 'Chat';
  }

  /**
   * Get message status indicator
   */
  function getMessageStatusIcon(message: ChatMessage): string {
    if (message.sender_id !== user?.id) return ''; // No status for received messages
    
    if (message.is_disappearing) {
      if (message.viewed_by_recipient) {
        return '👁️'; // Viewed
      } else {
        return '📨'; // Sent but not viewed
      }
    }
    
    return '✓'; // Regular message sent
  }

  /**
   * Render message bubble
   */
  function renderMessage(message: ChatMessage, index: number) {
    const isOwnMessage = message.sender_id === user?.id;
    const isLastMessage = index === messages.length - 1;
    const showTimestamp = index === 0 || 
      (index > 0 && new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000); // 5 minutes

    const hasMedia = message.media_url && (message.media_type === 'photo' || message.media_type === 'video');
    const canViewMessage = message.can_be_viewed !== false; // Default to true if not specified

    // Don't render messages that can't be viewed (they should be filtered out anyway)
    if (!canViewMessage) {
      return null;
    }

    return (
      <View key={message.id} className="mb-2">
        {showTimestamp && (
          <View className="items-center mb-2">
            <Text className="caption text-dark-text-tertiary">
              {formatMessageTime(message.created_at)}
            </Text>
          </View>
        )}
        
        <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <TouchableOpacity
            className={`max-w-[80%] ${hasMedia ? 'p-1' : 'px-3 py-2'} rounded-2xl ${
              isOwnMessage 
                ? 'bg-interactive ml-12' 
                : 'bg-dark-bg-tertiary mr-12'
            }`}
            onPress={() => handleMessageView(message)}
            activeOpacity={0.8}
          >
            {!isOwnMessage && messages.length > 1 && (
              <Text className={`caption text-dark-text-tertiary mb-1 ${hasMedia ? 'px-2 pt-1' : ''}`}>
                {message.sender_username}
              </Text>
            )}
            
            {/* Render media content */}
            {hasMedia && (
              <View className="mb-2">
                {message.media_type === 'photo' && message.media_url && (
                  <PlaceholderImage
                    uri={message.media_url}
                    width={200}
                    height={200}
                    borderRadius={12}
                    onImagePress={() => {
                      console.log('🖼️ Image tapped:', message.media_url);
                    }}
                  />
                )}
                {message.media_type === 'video' && (
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🎥 Video tapped:', message.media_url);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ 
                      width: 200, 
                      height: 200, 
                      borderRadius: 12,
                      backgroundColor: '#333',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text className="text-white text-4xl mb-2">▶️</Text>
                      <Text className="text-white text-sm">Video Message</Text>
                      <Text className="text-white text-xs opacity-70">Tap to play</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Render text content if it exists */}
            {message.content && (
              <Text className={`body-medium ${hasMedia ? 'px-2 pb-1' : ''} ${
                isOwnMessage ? 'text-white' : 'text-dark-text-primary'
              }`}>
                {message.content}
              </Text>
            )}

            {/* Message status indicator */}
            {isOwnMessage && (
              <View className="flex-row justify-end items-center mt-1">
                {message.is_disappearing && (
                  <Text className="caption text-white opacity-70 mr-2">
                    {message.viewed_by_recipient ? 'Viewed • Will disappear' : 'Disappearing'}
                  </Text>
                )}
                <Text className="text-white opacity-70 text-xs">
                  {getMessageStatusIcon(message)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Debug function to test disappearing messages flow
   * Call this from console: testDisappearingFlow()
   */
  const testDisappearingFlow = useCallback(async () => {
    if (!chatId || !user) return;
    
    console.log('🧪 Testing disappearing messages flow...');
    
    try {
      // 1. Send a test message
      console.log('1. Sending test message...');
      const testMessage = await chatService.sendMessage(chatId, 'Test disappearing message');
      console.log('✅ Message sent:', testMessage.id);
      console.log('   Sender ID:', testMessage.sender_id);
      
      // 2. Get the other participant (recipient) from the chat
      console.log('2. Finding recipient...');
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', user.id);
      
      const recipientId = participants?.[0]?.user_id;
      console.log('   Recipient ID:', recipientId);
      
      if (!recipientId) {
        console.log('❌ No recipient found - this might be a single-user chat');
        return;
      }
      
      // 3. Mark as viewed BY THE RECIPIENT (not the sender)
      console.log('3. Marking as viewed by recipient...');
      const { error: viewError } = await supabase.rpc('mark_message_viewed', {
        p_message_id: testMessage.id,
        p_viewer_id: recipientId
      });
      
      if (viewError) {
        console.error('❌ Error marking as viewed:', viewError);
        return;
      }
      console.log('✅ Marked as viewed by recipient');
      
      // 4. Check message state after viewing
      const { data: messageAfterView } = await supabase
        .from('messages')
        .select('viewed_by_recipient, should_disappear')
        .eq('id', testMessage.id)
        .single();
      
      console.log('   Message state after viewing:');
      console.log('   - viewed_by_recipient:', messageAfterView?.viewed_by_recipient);
      console.log('   - should_disappear:', messageAfterView?.should_disappear);
      
      // 5. Leave chat (mark both users as inactive)
      console.log('4. Leaving chat (marking users as inactive)...');
      await chatService.leaveChat(chatId);
      
      // Also mark recipient as inactive
      const { error: presenceError } = await supabase.rpc('update_chat_presence', {
        p_chat_id: chatId,
        p_user_id: recipientId,
        p_is_active: false
      });
      
      if (presenceError) {
        console.warn('Warning: Could not update recipient presence:', presenceError);
      }
      
      console.log('✅ Both users marked as inactive');
      
      // 6. Check presence state
      const { data: presence } = await supabase
        .from('chat_presence')
        .select('user_id, is_active')
        .eq('chat_id', chatId);
      
      console.log('   Presence state:');
      presence?.forEach(p => {
        console.log(`   - User ${p.user_id}: ${p.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      });
      
      // 7. Wait a moment
      console.log('5. Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 8. Trigger cleanup
      console.log('6. Triggering cleanup...');
      await disappearingMessagesService.triggerMessageCleanup();
      console.log('✅ Cleanup triggered');
      
      // 9. Check if message still exists
      console.log('7. Checking if message still exists...');
      const { data: messageCheck } = await supabase.from('messages')
        .select('id, should_disappear, viewed_by_recipient')
        .eq('id', testMessage.id)
        .single();
      
      if (messageCheck) {
        console.log(`📝 Message still exists:`);
        console.log(`   - should_disappear: ${messageCheck.should_disappear}`);
        console.log(`   - viewed_by_recipient: ${messageCheck.viewed_by_recipient}`);
        
        if (messageCheck.should_disappear) {
          console.log('⚠️ Message marked for deletion but not deleted yet');
        } else {
          console.log('❌ Message NOT marked for deletion');
        }
      } else {
        console.log('💨 SUCCESS! Message disappeared!');
        
        // 10. Test if UI update works by manually calling handleMessageDisappeared
        console.log('8. Testing manual UI update...');
        handleMessageDisappeared(testMessage.id);
        console.log('✅ Manual handleMessageDisappeared called');
      }
      
      // Re-enter chat for normal usage
      await chatService.enterChat(chatId);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }, [chatId, user]);

  // Expose test function to global scope for debugging
  useEffect(() => {
    if (__DEV__) {
      (global as any).testDisappearingFlow = testDisappearingFlow;
    }
  }, [testDisappearingFlow]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg-primary">
        <View className="flex-1 items-center justify-center">
          <Text className="body-medium text-dark-text-tertiary">Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg-primary">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-dark-border-subtle">
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-dark-bg-tertiary border border-dark-border-medium items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-dark-text-primary text-lg">←</Text>
        </TouchableOpacity>
        
        <View className="flex-1 items-center">
          <Text className="h2 text-dark-text-primary">{getChatDisplayName()}</Text>
          <View className="flex-row items-center">
            <Text className="caption text-dark-text-tertiary">
              {chat?.type === 'direct' ? 'Disappearing messages' : 'Direct message'}
            </Text>
          </View>
        </View>
        
        <View className="w-10 h-10" />{/* Spacer for centering */}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="h3 text-dark-text-secondary text-center mb-2">
                Start the conversation
              </Text>
              <Text className="body-medium text-dark-text-tertiary text-center">
                Send a message to {getChatDisplayName()} to get started
              </Text>
              {chat?.type === 'direct' && (
                <Text className="caption text-dark-text-tertiary text-center mt-2">
                  💨 Messages will disappear after being viewed
                </Text>
              )}
            </View>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
          )}
        </ScrollView>

        {/* Message Input */}
        <View className="flex-row items-end p-4 border-t border-dark-border-subtle">
          <TextInput
            className="flex-1 bg-dark-bg-tertiary border border-dark-border-medium rounded-full px-4 py-3 mr-3 text-dark-text-primary max-h-24"
            placeholder={chat?.type === 'direct' ? "Send a disappearing message..." : "Type a message..."}
            placeholderTextColor="#6B7280"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            textAlignVertical="center"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          
          <TouchableOpacity
            className={`w-12 h-12 rounded-full items-center justify-center ${
              newMessage.trim() && !isSending ? 'bg-interactive' : 'bg-dark-bg-tertiary'
            }`}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Text className={`text-lg ${
              newMessage.trim() && !isSending ? 'text-white' : 'text-dark-text-tertiary'
            }`}>
              {isSending ? '⏳' : '→'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 