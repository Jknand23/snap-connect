/**
 * MessagesScreen Component
 * 
 * Ephemeral messaging with integrated communities featuring sleek,
 * modern design and sports-focused interactions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { friendsService, FriendWithStatus } from '../../services/database/friendsService';
import { chatService, Chat } from '../../services/messaging/chatService';
import { MessagesStackParamList } from '../../app/navigation/MainNavigator';

type MessagesScreenNavigationProp = StackNavigationProp<MessagesStackParamList, 'MessagesList'>;

interface Community {
  id: string;
  name: string;
  emoji: string;
  memberCount: string;
  isLive: boolean;
  lastActivity: string;
  newMessages: number;
}

const TEAM_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Cowboys Nation',
    emoji: '🏈',
    memberCount: '45.2K',
    isLive: true,
    lastActivity: 'Game discussion • Now',
    newMessages: 12
  },
  {
    id: '2',
    name: 'Lakers Family',
    emoji: '🏀',
    memberCount: '67.8K',
    isLive: false,
    lastActivity: 'Trade rumors • 15m',
    newMessages: 3
  },
  {
    id: '3',
    name: 'Bronx Bombers',
    emoji: '⚾',
    memberCount: '32.4K',
    isLive: true,
    lastActivity: 'Live: World Series • Now',
    newMessages: 8
  },
];

export function MessagesScreen() {
  const navigation = useNavigation<MessagesScreenNavigationProp>();
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'chats' | 'communities'>('chats');
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load all chats (both direct and group chats)
   */
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [friendsData, chatsData] = await Promise.all([
        friendsService.getFriendsWithMessages(),
        chatService.getUserChats()
      ]);
      setFriends(friendsData);
      setChats(chatsData);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Refresh data
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadChats();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /**
   * Navigate to profile
   */
  function openProfile() {
    navigation.navigate('Profile');
  }

  /**
   * Navigate to friends screen
   */
  function openFriendsScreen() {
    navigation.navigate('Friends');
  }

  /**
   * Open chat with friend
   */
  function openFriendChat(friendId: string) {
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      navigation.navigate('Chat', {
        friendId: friendId,
        friendUsername: friend.username,
      });
    }
  }

  /**
   * Open any chat (direct or group)
   */
  function openChat(chat: Chat) {
    if (chat.type === 'direct' && chat.other_user) {
      navigation.navigate('Chat', {
        friendId: chat.other_user.id,
        friendUsername: chat.other_user.username,
      });
    } else if (chat.type === 'group') {
      navigation.navigate('GroupChat', {
        chatId: chat.id,
        chatName: chat.name || 'Group Chat',
      });
    }
  }

  /**
   * Join community
   */
  function joinCommunity(communityId: string) {
    console.log('Joining community:', communityId);
  }

  /**
   * Create group chat
   */
  function createGroupChat() {
    navigation.navigate('CreateGroupChat');
  }

  /**
   * Get team emoji for team name
   */
  function getTeamEmoji(teams: string[]): string {
    if (!teams || teams.length === 0) return '🏟️';
    
    // Simple team to emoji mapping
    const teamEmojis: Record<string, string> = {
      'cowboys': '🏈',
      'lakers': '🏀',
      'yankees': '⚾',
      'patriots': '🏈',
      'warriors': '🏀',
      'dodgers': '⚾',
    };

    const firstTeam = teams[0]?.toLowerCase() || '';
    return teamEmojis[firstTeam] || '🏟️';
  }

  /**
   * Render chat item (both direct and group chats)
   */
  function renderChat(chat: Chat) {
    const isGroupChat = chat.type === 'group';
    const displayName = isGroupChat ? chat.name || 'Group Chat' : chat.other_user?.username || 'Unknown';
    const lastMessageTime = chat.last_message ? 
      new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      'No messages';
    
    const lastMessageText = chat.last_message ? 
      `${chat.last_message.sender_username}: ${chat.last_message.content}` : 
      'No messages yet';

    return (
      <TouchableOpacity 
        key={chat.id} 
        className="card-minimal mb-2 p-3 interactive-item"
        onPress={() => openChat(chat)}
      >
        <View className="flex-row items-center">
          <View className="relative mr-3">
            <View className={`w-12 h-12 rounded-full items-center justify-center ${
              chat.has_unread_messages ? 'border-2 border-team-primary' : 'border border-dark-border-medium'
            } bg-dark-bg-tertiary`}>
              <Text className="text-lg">
                {isGroupChat ? '👥' : '🏟️'}
              </Text>
            </View>
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="body-medium text-dark-text-primary font-medium">
                {displayName}
                {isGroupChat && chat.participant_count && (
                  <Text className="text-dark-text-tertiary text-sm"> ({chat.participant_count})</Text>
                )}
              </Text>
              {chat.has_unread_messages && (
                <View className="w-2 h-2 bg-live-indicator rounded-full" />
              )}
            </View>
            <Text className={`caption ${
              chat.has_unread_messages ? 'text-live-indicator' : 'text-dark-text-tertiary'
            }`}>
              {chat.has_unread_messages ? `New message • ${lastMessageTime}` : `${lastMessageText} • ${lastMessageTime}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /**
   * Render friend item
   */
  function renderFriend(friend: FriendWithStatus) {
    const teamEmoji = getTeamEmoji(friend.favorite_teams || []);
    const lastMessageTime = friend.last_message_time ? 
      new Date(friend.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      'No messages';

    return (
      <TouchableOpacity 
        key={friend.id} 
        className="card-minimal mb-2 p-3 interactive-item"
        onPress={() => openFriendChat(friend.id)}
      >
        <View className="flex-row items-center">
          <View className="relative mr-3">
            <View className={`w-12 h-12 rounded-full items-center justify-center ${
              friend.has_new_messages ? 'border-2 border-team-primary' : 'border border-dark-border-medium'
            } bg-dark-bg-tertiary`}>
              <Text className="text-lg">{teamEmoji}</Text>
              {friend.is_online && (
                <View className="absolute -bottom-0.5 -right-0.5 status-online" />
              )}
            </View>
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="body-medium text-dark-text-primary font-medium">{friend.username}</Text>
              {friend.has_new_messages && (
                <View className="w-2 h-2 bg-live-indicator rounded-full" />
              )}
            </View>
            <Text className={`caption ${
              friend.has_new_messages ? 'text-live-indicator' : 'text-dark-text-tertiary'
            }`}>
              {friend.has_new_messages ? `New message • ${lastMessageTime}` : `Last message • ${lastMessageTime}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /**
   * Render community item
   */
  function renderCommunity(community: Community) {
    return (
      <TouchableOpacity 
        key={community.id} 
        className="card-sleek mb-2 p-3 interactive-item"
        onPress={() => joinCommunity(community.id)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="relative mr-3">
              <View className={`w-12 h-12 rounded-lg items-center justify-center ${
                community.isLive ? 'border-2 border-live-indicator' : 'border border-dark-border-medium'
              } bg-dark-bg-tertiary`}>
                <Text className="text-lg">{community.emoji}</Text>
                {community.isLive && (
                  <View className="absolute -top-1 -right-1">
                    <Text className="live-badge text-xs">LIVE</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="body-medium text-dark-text-primary font-medium">{community.name}</Text>
                <Text className="caption text-dark-text-tertiary">{community.memberCount}</Text>
              </View>
              <Text className="caption text-dark-text-tertiary">{community.lastActivity}</Text>
            </View>
          </View>

          {community.newMessages > 0 && (
            <View className="bg-interactive w-6 h-6 rounded-full items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">{community.newMessages}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg-primary">
      {/* Header with Profile and Add Friends */}
      <View className="flex-row items-center justify-between p-4 border-b border-dark-border-subtle">
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-dark-bg-tertiary border border-dark-border-medium items-center justify-center"
          onPress={openProfile}
        >
          <Text className="text-lg">👤</Text>
        </TouchableOpacity>

        <Text className="h1 text-dark-text-primary">Messages</Text>

        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-interactive items-center justify-center"
          onPress={openFriendsScreen}
        >
          <Text className="text-white text-lg font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View className="flex-row bg-dark-bg-secondary border-b border-dark-border-subtle">
        <TouchableOpacity
          className={`flex-1 py-4 px-6 ${selectedTab === 'chats' ? 'border-b-2 border-interactive' : ''}`}
          onPress={() => setSelectedTab('chats')}
        >
          <Text className={`body-medium text-center font-medium ${
            selectedTab === 'chats' ? 'text-interactive' : 'text-dark-text-tertiary'
          }`}>
            Chats ({chats.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 py-4 px-6 ${selectedTab === 'communities' ? 'border-b-2 border-interactive' : ''}`}
          onPress={() => setSelectedTab('communities')}
        >
          <Text className={`body-medium text-center font-medium ${
            selectedTab === 'communities' ? 'text-interactive' : 'text-dark-text-tertiary'
          }`}>
            Communities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'chats' && (
          <View className="p-4">
            {/* Create Group Chat Button */}
            <TouchableOpacity
              className="bg-team-primary rounded-lg p-4 mb-4 flex-row items-center justify-center"
              onPress={createGroupChat}
            >
              <Text className="text-2xl mr-3">👥</Text>
              <View className="flex-1">
                <Text className="text-dark-text-primary font-semibold text-base">Create Group Chat</Text>
                <Text className="text-dark-text-tertiary text-sm">
                  Start an ephemeral group conversation
                </Text>
              </View>
              <Text className="text-dark-text-secondary text-lg">→</Text>
            </TouchableOpacity>

            {chats.length === 0 ? (
              <View className="items-center py-12">
                <Text className="h3 text-dark-text-secondary text-center mb-4">No Chats Yet</Text>
                <Text className="body-medium text-dark-text-tertiary text-center mb-6">
                  Create a group chat or add friends to start messaging
                </Text>
                <Button
                  title="Find Friends"
                  variant="primary"
                  size="md"
                  onPress={openFriendsScreen}
                />
              </View>
            ) : (
              <>
                <Text className="text-dark-text-secondary font-medium mb-3 text-sm uppercase tracking-wide">
                  Your Chats ({chats.length})
                </Text>
                {chats.map(renderChat)}
              </>
            )}
          </View>
        )}

        {selectedTab === 'communities' && (
          <View className="p-4">
            {TEAM_COMMUNITIES.map(renderCommunity)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 