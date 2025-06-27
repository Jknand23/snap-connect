/**
 * StoryFeedItem Component
 * 
 * Individual story item for display in the stories feed with proper styling,
 * unread indicators, and touch handling for story viewing.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface StoryFeedItemProps {
  userAvatar?: string;
  username: string;
  storyThumbnail: string;
  hasUnviewed: boolean;
  onPress: () => void;
  isUserStory?: boolean;
}

/**
 * Individual story item component
 */
export function StoryFeedItem({
  userAvatar,
  username,
  storyThumbnail,
  hasUnviewed,
  onPress,
  isUserStory = false,
}: StoryFeedItemProps) {
  /**
   * Get ring color based on story status
   */
  function getRingColor() {
    if (isUserStory) return 'ring-green-500';
    if (hasUnviewed) return 'ring-blue-500';
    return 'ring-gray-600';
  }

  /**
   * Render unviewed indicator
   */
  function renderUnviewedIndicator() {
    if (isUserStory) {
      return (
        <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center">
          <Text className="text-white text-xs">👁</Text>
        </View>
      );
    }

    if (hasUnviewed) {
      return <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />;
    }

    return null;
  }

  return (
    <TouchableOpacity onPress={onPress} className="items-center mr-4">
      <View className={`relative ${getRingColor()} rounded-full p-1`}>
        <Image
          source={{ uri: storyThumbnail }}
          className="w-16 h-16 rounded-full"
          resizeMode="cover"
        />
        {renderUnviewedIndicator()}
      </View>
      <Text className="text-xs text-white mt-1 text-center" numberOfLines={1}>
        {isUserStory ? 'Your Story' : username}
      </Text>
    </TouchableOpacity>
  );
} 