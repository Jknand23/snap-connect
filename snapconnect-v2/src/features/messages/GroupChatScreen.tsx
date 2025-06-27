/**
 * Group Chat Screen
 * 
 * Displays group chat with ephemeral messaging where content disappears
 * only after ALL group members have viewed each message. Shows view tracking
 * indicators and real-time updates on message status.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { groupMessagingService, GroupMessage, GroupChatInfo } from '../../services/messaging/groupMessagingService';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';

type GroupChatRouteParams = {
  chatId: string;
  chatName?: string;
};

type GroupChatRouteProp = RouteProp<{ GroupChat: GroupChatRouteParams }, 'GroupChat'>;

/**
 * Group chat screen with ephemeral messaging and view tracking
 */
export default function GroupChatScreen() {
  const route = useRoute<GroupChatRouteProp>();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupChatInfo | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  /**
   * Load group chat messages and info
   */
  const loadGroupChat = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Loading group chat:', chatId);
      
      // Load messages and group info in parallel, and get current user ID
      const [messagesResult, groupInfoResult, userId] = await Promise.all([
        groupMessagingService.getGroupChatMessages(chatId),
        groupMessagingService.getGroupChatInfo(chatId),
        groupMessagingService.getCurrentUserId(),
      ]);

      console.log('✅ Group chat loaded:', {
        messagesCount: messagesResult.length,
        groupName: groupInfoResult.name,
        totalMembers: groupInfoResult.total_members,
        currentUserId: userId
      });

      setMessages(messagesResult);
      setGroupInfo(groupInfoResult);
      setCurrentUserId(userId);

      // Update presence to show user is active in chat
      await groupMessagingService.updateGroupChatPresence(chatId, true);
    } catch (error) {
      console.error('❌ Failed to load group chat:', error);
      Alert.alert('Error', 'Failed to load group chat');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  /**
   * Send message to group
   */
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || sendingMessage) return;

    const messageText = inputText.trim();
    setInputText('');
    setSendingMessage(true);

    try {
      // Add debugging to see what's happening
      console.log('🔍 Attempting to send group message:', {
        chatId,
        messageText,
        currentUserId
      });

      const newMessage = await groupMessagingService.sendGroupMessage(
        chatId,
        messageText,
        undefined,
        'text'
      );

      console.log('✅ Message sent successfully:', newMessage.id);

      // Add message to local state immediately for better UX
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      Alert.alert('Error', 'Failed to send message. Please check console for details.');
      // Restore input text on error
      setInputText(messageText);
    } finally {
      setSendingMessage(false);
    }
  }, [inputText, sendingMessage, chatId]);

  /**
   * Mark message as viewed when it becomes visible
   */
  const markMessageAsViewed = useCallback(async (messageId: string) => {
    try {
      await groupMessagingService.markGroupMessageAsViewed(messageId);
    } catch (error) {
      console.warn('Failed to mark message as viewed:', error);
    }
  }, []);

  /**
   * Handle refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupChat();
    setRefreshing(false);
  }, [loadGroupChat]);

  /**
   * Setup real-time subscriptions
   */
  useEffect(() => {
    const subscription = groupMessagingService.subscribeToGroupMessages(
      chatId,
      // New message handler
      (newMessage: GroupMessage) => {
        setMessages(prev => {
          const exists = prev.find(msg => msg.id === newMessage.id);
          if (exists) {
            // Update existing message with new view stats
            return prev.map(msg => msg.id === newMessage.id ? newMessage : msg);
          } else {
            // Add new message
            return [...prev, newMessage];
          }
        });
        
        // Auto-scroll to new messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      // Message disappeared handler
      (messageId: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      },
      // View status update handler
      (messageId: string, viewStats) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, viewed_by_count: viewStats.viewed_by_count, pending_viewers: viewStats.pending_viewers }
            : msg
        ));
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, [chatId]);

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadGroupChat();
  }, [loadGroupChat]);

  /**
   * Update presence on focus/blur
   */
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      groupMessagingService.updateGroupChatPresence(chatId, true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      groupMessagingService.updateGroupChatPresence(chatId, false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      // Mark as inactive when leaving
      groupMessagingService.updateGroupChatPresence(chatId, false);
    };
  }, [navigation, chatId]);

  /**
   * Render individual message with view tracking
   */
  const renderMessage = useCallback(({ item: message }: { item: GroupMessage }) => {
    const isOwnMessage = currentUserId ? message.sender_id === currentUserId : false;
    const viewProgress = message.total_participants > 0 
      ? message.viewed_by_count / message.total_participants 
      : 0;

    return (
      <View 
        className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}
        onLayout={() => {
          // Mark as viewed when message renders (simplified approach)
          if (!message.is_viewed_by_me && !isOwnMessage) {
            markMessageAsViewed(message.id);
          }
        }}
      >
        <View className={`max-w-[80%] p-3 rounded-2xl ${
          isOwnMessage 
            ? 'bg-blue-500 rounded-br-md' 
            : 'bg-gray-100 rounded-bl-md'
        }`}>
          {/* Sender name for group messages */}
          {!isOwnMessage && (
            <Text className="text-xs font-medium text-gray-600 mb-1">
              {message.sender_username}
            </Text>
          )}
          
          {/* Message content */}
          {message.media_type === 'photo' && message.media_url ? (
            <View className="mb-2">
              <PlaceholderImage
                uri={message.media_url}
                width={200}
                height={200}
                borderRadius={12}
                onImagePress={() => {
                  console.log('🖼️ Group chat image tapped:', message.media_url);
                }}
              />
              {message.content && (
                <Text className={`text-sm mt-2 ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                  {message.content}
                </Text>
              )}
            </View>
          ) : message.media_type === 'video' && message.media_url ? (
            <View className="mb-2">
              <TouchableOpacity
                onPress={() => {
                  console.log('🎥 Group chat video tapped:', message.media_url);
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
              {message.content && (
                <Text className={`text-sm mt-2 ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                  {message.content}
                </Text>
              )}
            </View>
          ) : (
            <Text className={`text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
              {message.content}
            </Text>
          )}
          
          {/* View tracking indicator */}
          <View className="flex-row items-center justify-between mt-2">
            <Text className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {new Date(message.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {/* View progress indicator */}
            <View className="flex-row items-center ml-2">
              <View className={`w-12 h-1 rounded-full ${isOwnMessage ? 'bg-blue-300' : 'bg-gray-300'} mr-1`}>
                <View 
                  className={`h-full rounded-full ${isOwnMessage ? 'bg-white' : 'bg-blue-500'}`}
                  style={{ width: `${viewProgress * 100}%` }}
                />
              </View>
              <Text className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.viewed_by_count}/{message.total_participants}
              </Text>
            </View>
          </View>

          {/* Pending viewers (for own messages) */}
          {isOwnMessage && message.pending_viewers.length > 0 && (
            <Text className="text-xs text-blue-100 mt-1">
              Waiting for: {message.pending_viewers.slice(0, 2).join(', ')}
              {message.pending_viewers.length > 2 && ` +${message.pending_viewers.length - 2} more`}
            </Text>
          )}

          {/* Message will disappear indicator */}
          {message.can_disappear && (
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name="timer-outline" 
                size={12} 
                color={isOwnMessage ? "#bfdbfe" : "#6b7280"} 
              />
              <Text className={`text-xs ml-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                Will disappear when all leave
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [markMessageAsViewed, currentUserId]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {groupInfo?.name || chatName || 'Group Chat'}
          </Text>
          <Text className="text-sm text-gray-500">
            {groupInfo?.total_members} members • {groupInfo?.active_participants.length} active
          </Text>
        </View>

        <TouchableOpacity className="p-2">
          <Ionicons name="information-circle-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View className="flex-row items-center p-4 border-t border-gray-200">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              multiline
              maxLength={500}
              className="flex-1 text-base max-h-20"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
            />
          </View>
          
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim() || sendingMessage}
            className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() && !sendingMessage ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <Ionicons 
              name="send" 
              size={18} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 