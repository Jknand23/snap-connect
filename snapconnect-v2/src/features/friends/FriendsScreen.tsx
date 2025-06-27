/**
 * Friends Screen Component
 * 
 * Comprehensive friend management with search, requests, and connections
 * featuring sports-focused discovery and sleek modern design.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { friendsService, FriendWithStatus, FriendRequest } from '../../services/database/friendsService';
import { MessagesStackParamList } from '../../app/navigation/MainNavigator';

type FriendsScreenNavigationProp = StackNavigationProp<MessagesStackParamList, 'Friends'>;

type TabType = 'search' | 'friends' | 'requests';

export function FriendsScreen() {
  const navigation = useNavigation<FriendsScreenNavigationProp>();
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendWithStatus[]>([]);
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load friends data
   */
  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const friendsData = await friendsService.getFriendsWithMessages();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load pending requests
   */
  const loadPendingRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      const requests = await friendsService.getPendingRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }, [user]);

  /**
   * Search users
   */
  const searchUsers = useCallback(async (query: string) => {
    if (!user || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const results = await friendsService.searchUsers(query.trim(), user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Send friend request
   */
  const sendFriendRequest = async (userId: string) => {
    try {
      await friendsService.sendFriendRequest(userId);
      // Refresh search results to update button state
      if (searchQuery) {
        await searchUsers(searchQuery);
      }
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  /**
   * Accept friend request
   */
  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await friendsService.acceptFriendRequest(friendshipId);
      await Promise.all([loadFriends(), loadPendingRequests()]);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  /**
   * Decline friend request
   */
  const declineFriendRequest = async (friendshipId: string) => {
    try {
      await friendsService.declineFriendRequest(friendshipId);
      await loadPendingRequests();
      Alert.alert('Success', 'Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };

  /**
   * Refresh data
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadFriends(), loadPendingRequests()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedTab === 'search') {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedTab, searchUsers]);

  /**
   * Get team emoji for team name
   */
  function getTeamEmoji(teams: string[]): string {
    if (!teams || teams.length === 0) return '🏟️';
    
    // Simple team to emoji mapping - could be expanded
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
   * Render search result item
   */
  function renderSearchResult(user: FriendWithStatus) {
    const mutualTeamsText = user.mutual_teams?.length 
      ? `${user.mutual_teams.length} mutual team${user.mutual_teams.length > 1 ? 's' : ''}`
      : 'No mutual teams';

    return (
      <View key={user.id} className="card-minimal mb-3 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-dark-bg-tertiary border border-dark-border-medium items-center justify-center mr-3">
              <Text className="text-lg">{getTeamEmoji(user.favorite_teams || [])}</Text>
            </View>
            
            <View className="flex-1">
              <Text className="body-medium text-dark-text-primary font-medium">{user.username}</Text>
              {user.full_name && (
                <Text className="caption text-dark-text-secondary">{user.full_name}</Text>
              )}
              <Text className="caption text-dark-text-tertiary">{mutualTeamsText}</Text>
            </View>
          </View>

          <View className="ml-3">
            {user.friendship_status === 'none' && (
              <TouchableOpacity
                className="bg-interactive px-4 py-2 rounded-full"
                onPress={() => sendFriendRequest(user.id)}
              >
                <Text className="text-white font-medium">Add</Text>
              </TouchableOpacity>
            )}
            {user.friendship_status === 'pending_sent' && (
              <View className="bg-dark-bg-tertiary px-4 py-2 rounded-full">
                <Text className="text-dark-text-tertiary font-medium">Pending</Text>
              </View>
            )}
            {user.friendship_status === 'pending_received' && (
              <TouchableOpacity
                className="bg-live-indicator px-4 py-2 rounded-full"
                onPress={() => user.friendship_id && acceptFriendRequest(user.friendship_id)}
              >
                <Text className="text-white font-medium">Accept</Text>
              </TouchableOpacity>
            )}
            {user.friendship_status === 'friends' && (
              <View className="bg-dark-bg-tertiary px-4 py-2 rounded-full">
                <Text className="text-dark-text-tertiary font-medium">Friends</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  /**
   * Render friend item
   */
  function renderFriend(friend: FriendWithStatus) {
    return (
      <TouchableOpacity key={friend.id} className="card-minimal mb-2 p-3 interactive-item">
        <View className="flex-row items-center">
          <View className="relative mr-3">
            <View className="w-12 h-12 rounded-full bg-dark-bg-tertiary border border-dark-border-medium items-center justify-center">
              <Text className="text-lg">{getTeamEmoji(friend.favorite_teams || [])}</Text>
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
            <Text className="caption text-dark-text-tertiary">
              {friend.mutual_teams?.length} mutual teams
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /**
   * Render friend request item
   */
  function renderFriendRequest(request: FriendRequest) {
    return (
      <View key={request.id} className="card-minimal mb-3 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-dark-bg-tertiary border border-dark-border-medium items-center justify-center mr-3">
              <Text className="text-lg">{getTeamEmoji(request.requester_profile.favorite_teams || [])}</Text>
            </View>
            
            <View className="flex-1">
              <Text className="body-medium text-dark-text-primary font-medium">
                {request.requester_profile.username}
              </Text>
              {request.requester_profile.full_name && (
                <Text className="caption text-dark-text-secondary">
                  {request.requester_profile.full_name}
                </Text>
              )}
              <Text className="caption text-dark-text-tertiary">
                {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View className="flex-row ml-3">
            <TouchableOpacity
              className="bg-live-indicator px-3 py-2 rounded-full mr-2"
              onPress={() => acceptFriendRequest(request.id)}
            >
              <Text className="text-white font-medium text-sm">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-dark-bg-tertiary px-3 py-2 rounded-full"
              onPress={() => declineFriendRequest(request.id)}
            >
              <Text className="text-dark-text-tertiary font-medium text-sm">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        
        <Text className="h1 text-dark-text-primary">Friends</Text>
        
        <View className="w-10 h-10" /> {/* Spacer for centering */}
      </View>

      {/* Tabs */}
      <View className="flex-row bg-dark-bg-secondary border-b border-dark-border-subtle">
        {(['search', 'friends', 'requests'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-3 px-4 ${selectedTab === tab ? 'border-b-2 border-interactive' : ''}`}
            onPress={() => setSelectedTab(tab)}
          >
            <Text className={`body-medium text-center font-medium ${
              selectedTab === tab ? 'text-interactive' : 'text-dark-text-tertiary'
            }`}>
              {tab === 'search' && 'Search'}
              {tab === 'friends' && `Friends (${friends.length})`}
              {tab === 'requests' && `Requests (${pendingRequests.received.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      {selectedTab === 'search' && (
        <View className="p-4 border-b border-dark-border-subtle">
          <TextInput
            className="bg-dark-bg-tertiary border border-dark-border-medium rounded-xl px-4 py-3 text-dark-text-primary"
            placeholder="Search by username..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {/* Content */}
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'search' && (
          <View>
            {searchQuery.length < 2 ? (
              <View className="items-center py-8">
                <Text className="body-medium text-dark-text-tertiary text-center">
                  Type at least 2 characters to search for users
                </Text>
              </View>
            ) : isLoading ? (
              <View className="items-center py-8">
                <Text className="body-medium text-dark-text-tertiary">Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="items-center py-8">
                <Text className="body-medium text-dark-text-tertiary text-center">
                  No users found matching "{searchQuery}"
                </Text>
              </View>
            ) : (
              searchResults.map(renderSearchResult)
            )}
          </View>
        )}

        {selectedTab === 'friends' && (
          <View>
            {friends.length === 0 ? (
              <View className="items-center py-8">
                <Text className="body-medium text-dark-text-tertiary text-center">
                  No friends yet. Search for users to add them!
                </Text>
              </View>
            ) : (
              friends.map(renderFriend)
            )}
          </View>
        )}

        {selectedTab === 'requests' && (
          <View>
            {pendingRequests.received.length === 0 ? (
              <View className="items-center py-8">
                <Text className="body-medium text-dark-text-tertiary text-center">
                  No pending friend requests
                </Text>
              </View>
            ) : (
              pendingRequests.received.map(renderFriendRequest)
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 