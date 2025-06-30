/**
 * Create Group Chat Screen
 * 
 * Allows users to create new group chats by selecting friends
 * and setting group details like name and initial message.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { MessagesStackParamList } from '../../app/navigation/MainNavigator';
import { friendsService, FriendWithStatus } from '../../services/database/friendsService';
import { groupMessagingService } from '../../services/messaging/groupMessagingService';
import { messagingService } from '../../services/messaging/messagingService';

type CreateGroupChatNavigationProp = StackNavigationProp<MessagesStackParamList, 'CreateGroupChat'>;

interface SelectedFriend {
  id: string;
  username: string;
  avatar_url?: string | null;
}

/**
 * Screen for creating new group chats
 */
export default function CreateGroupChatScreen() {
  const navigation = useNavigation<CreateGroupChatNavigationProp>();
  
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<SelectedFriend[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  /**
   * Load friends list
   */
  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const friendsList = await friendsService.getFriendsWithMessages();
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle friend selection
   */
  const toggleFriendSelection = useCallback((friend: FriendWithStatus) => {
    setSelectedFriends(prev => {
      const isSelected = prev.find(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, {
          id: friend.id,
          username: friend.username,
          avatar_url: friend.avatar_url,
        }];
      }
    });
  }, []);

  /**
   * Create the group chat
   */
  const createGroupChat = useCallback(async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Select Friends', 'Please select at least one friend to create a group chat.');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Group Name', 'Please enter a name for your group chat.');
      return;
    }

    try {
      setCreating(true);

      // Create the group chat using the messaging service
      const chatData = {
        name: groupName.trim(),
        type: 'group' as const,
        participantIds: selectedFriends.map(f => f.id),
      };

      const newChat = await messagingService.createChat(chatData);

      // Navigate to the new group chat
      navigation.replace('GroupChat', {
        chatId: newChat.id,
        chatName: groupName.trim(),
      });

    } catch (error) {
      console.error('Failed to create group chat:', error);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [selectedFriends, groupName, navigation]);

  /**
   * Load friends on mount
   */
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  /**
   * Render friend item with selection checkbox
   */
  const renderFriendItem = useCallback(({ item: friend }: { item: FriendWithStatus }) => {
    const isSelected = selectedFriends.find(f => f.id === friend.id);
    
    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-gray-100"
        onPress={() => toggleFriendSelection(friend)}
      >
        {/* Selection indicator */}
        <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                          isSelected ? 'bg-interactive border-interactive' : 'border-dark-border-medium'
        }`}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>

        {/* Friend avatar placeholder */}
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
          <Text className="text-lg">👤</Text>
        </View>

        {/* Friend info */}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900">{friend.username}</Text>
          <Text className="text-sm text-gray-500">
            {friend.is_online ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Selection indicator icon */}
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
        )}
      </TouchableOpacity>
    );
  }, [selectedFriends, toggleFriendSelection]);

  /**
   * Render selected friend chips
   */
  const renderSelectedFriends = () => {
    if (selectedFriends.length === 0) return null;

    return (
      <View className="px-4 py-2">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Selected ({selectedFriends.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {selectedFriends.map(friend => (
              <View key={friend.id} className="bg-interactive/20 border border-interactive rounded-full px-3 py-1 mr-2 flex-row items-center">
                <Text className="text-sm text-blue-800 mr-1">{friend.username}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedFriends(prev => prev.filter(f => f.id !== friend.id))}
                >
                  <Ionicons name="close-circle" size={16} color="#1e40af" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-gray-900">New Group</Text>
        
        <TouchableOpacity
          onPress={createGroupChat}
          disabled={creating || selectedFriends.length === 0 || !groupName.trim()}
          className={`px-4 py-2 rounded-full ${
            creating || selectedFriends.length === 0 || !groupName.trim()
              ? 'bg-gray-300'
              : 'bg-interactive'
          }`}
        >
          <Text className={`font-medium ${
            creating || selectedFriends.length === 0 || !groupName.trim()
              ? 'text-gray-500'
              : 'text-white'
          }`}>
            {creating ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group Details */}
      <View className="p-4 border-b border-gray-200">
        <Text className="text-sm font-medium text-gray-700 mb-2">Group Name</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name..."
          className="bg-gray-100 rounded-lg px-4 py-3 text-base"
          maxLength={50}
          returnKeyType="done"
        />
        <Text className="text-xs text-gray-500 mt-1">
          {groupName.length}/50 characters
        </Text>
      </View>

      {/* Selected Friends */}
      {renderSelectedFriends()}

      {/* Friends List Header */}
      <View className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <Text className="text-sm font-medium text-gray-700">
          Select Friends ({friends.length} available)
        </Text>
      </View>

      {/* Friends List */}
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderFriendItem}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            {loading ? (
              <Text className="text-gray-500">Loading friends...</Text>
            ) : (
              <>
                <Text className="text-gray-500 text-center mb-2">No friends found</Text>
                <Text className="text-gray-400 text-center text-sm">
                  Add some friends first to create group chats
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Info Footer */}
      <View className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <Text className="text-xs text-gray-500 text-center">
          💬 Messages in this group will disappear after everyone views them
        </Text>
      </View>
    </SafeAreaView>
  );
} 