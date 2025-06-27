/**
 * Community Chat Screen
 * 
 * Displays community messages with 1-hour auto-expiration.
 * Supports team-specific and league-wide community discussions.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { communitiesService, CommunityMessageWithSender } from '../../services/messaging/communitiesService';
import { Button } from '../../components/ui/Button';

type CommunityChatRouteParams = {
  CommunityChat: {
    communityId: string;
    communityName: string;
    communityEmoji: string;
    communityType: 'team' | 'league';
  };
};

type CommunityChatRouteProp = RouteProp<CommunityChatRouteParams, 'CommunityChat'>;
type CommunityChatNavigationProp = StackNavigationProp<CommunityChatRouteParams, 'CommunityChat'>;

/**
 * Community chat screen component
 */
export function CommunityChatScreen() {
  const navigation = useNavigation<CommunityChatNavigationProp>();
  const route = useRoute<CommunityChatRouteProp>();
  const { communityId, communityName, communityEmoji, communityType } = route.params;

  const [messages, setMessages] = useState<CommunityMessageWithSender[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);

  /**
   * Load initial messages
   */
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const messagesData = await communitiesService.getCommunityMessages(communityId, 50);
      setMessages(messagesData);
      setHasMoreMessages(messagesData.length === 50);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  /**
   * Load older messages
   */
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    try {
      setIsLoadingMore(true);
      const oldestMessage = messages[0];
      const olderMessages = await communitiesService.getCommunityMessages(
        communityId,
        50,
        oldestMessage.created_at
      );
      
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMoreMessages(olderMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Send message
   */
  const sendMessage = async () => {
    const content = messageText.trim();
    if (!content || isSending) return;

    try {
      setIsSending(true);
      setMessageText(''); // Clear input immediately for better UX

      const newMessage = await communitiesService.sendCommunityMessage(
        communityId,
        content,
        undefined,
        'text'
      );

      // Add message to local state (real-time will also trigger but this provides immediate feedback)
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(content); // Restore message text on error
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle new message from real-time subscription
   */
  const handleNewMessage = useCallback((message: CommunityMessageWithSender) => {
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      
      return [...prev, message];
    });
  }, []);

  /**
   * Add reaction to message
   */
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await communitiesService.addReaction(messageId, emoji);
      // Reload messages to update reaction counts
      await loadMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatMessageTime = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    
    return messageTime.toLocaleDateString();
  };

  /**
   * Get expiration indicator
   */
  const getExpirationInfo = (expiresAt: string): { timeLeft: string; isExpiringSoon: boolean } => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins <= 0) {
      return { timeLeft: 'Expired', isExpiringSoon: true };
    }

    const isExpiringSoon = diffMins <= 10; // Last 10 minutes
    
    if (diffMins < 60) {
      return { timeLeft: `${diffMins}m left`, isExpiringSoon };
    }
    
    return { timeLeft: '< 1h', isExpiringSoon: false };
  };

  /**
   * Render message item
   */
  const renderMessage = ({ item: message }: { item: CommunityMessageWithSender }) => {
    const expirationInfo = getExpirationInfo(message.expires_at);
    
    return (
      <View style={styles.messageContainer}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{message.sender_username}</Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(message.created_at)}
          </Text>
          <Text style={[
            styles.expirationText,
            expirationInfo.isExpiringSoon && styles.expirationSoon
          ]}>
            {expirationInfo.timeLeft}
          </Text>
        </View>
        
        <Text style={styles.messageContent}>{message.content}</Text>
        
        {(message.reaction_count || 0) > 0 && (
          <View style={styles.reactionsContainer}>
            <Text style={styles.reactionCount}>
              {message.reaction_count || 0} reaction{(message.reaction_count || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        
        <View style={styles.messageActions}>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => addReaction(message.id, '👍')}
          >
            <Text style={styles.reactionEmoji}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => addReaction(message.id, '❤️')}
          >
            <Text style={styles.reactionEmoji}>❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => addReaction(message.id, '🔥')}
          >
            <Text style={styles.reactionEmoji}>🔥</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      title: `${communityEmoji} ${communityName}`,
      headerTitleStyle: { fontSize: 18, fontWeight: 'bold' },
    });
  }, [navigation, communityName, communityEmoji]);

  // Load initial data and set up real-time subscription
  useEffect(() => {
    loadMessages();
    
    // Mark community as read
    communitiesService.markCommunityAsRead(communityId);

    // Set up real-time subscription
    subscriptionRef.current = communitiesService.subscribeToMessages(
      communityId,
      handleNewMessage
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [communityId, loadMessages, handleNewMessage]);

  // Clean up expired messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => 
        prev.filter(msg => new Date(msg.expires_at) > new Date())
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Community Info Banner */}
        <View style={styles.communityBanner}>
          <Text style={styles.bannerText}>
            {communityType === 'team' ? 'Team Community' : 'League Discussion'} • Messages expire in 1 hour
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          refreshing={isLoading}
          onRefresh={loadMessages}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={`Message ${communityName}...`}
            placeholderTextColor="#888"
            multiline
            maxLength={500}
          />
          <Button
            title="Send"
            onPress={sendMessage}
            disabled={!messageText.trim() || isSending}
            size="sm"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  communityBanner: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bannerText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  messageTime: {
    color: '#888',
    fontSize: 12,
    marginRight: 8,
  },
  expirationText: {
    color: '#888',
    fontSize: 10,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expirationSoon: {
    color: '#ff6b6b',
    backgroundColor: '#2d1b1b',
  },
  messageContent: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  reactionsContainer: {
    marginBottom: 8,
  },
  reactionCount: {
    color: '#888',
    fontSize: 12,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },

}); 