/**
 * Main Navigator Component
 * 
 * Sets up bottom tab navigation for the main app screens with sleek,
 * modern design and sports-focused styling.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { DiscoveryScreen } from '../../features/discovery/DiscoveryScreen';
import { CameraScreen } from '../../features/camera/CameraScreen';
import { MessagesScreen } from '../../features/messages/MessagesScreen';
import { FriendsScreen } from '../../features/friends/FriendsScreen';
import { ChatScreen } from '../../features/chat/ChatScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { StoryCreatorScreen } from '../../features/stories/StoryCreatorScreen';
import CreateGroupChatScreen from '../../features/messages/CreateGroupChatScreen';
import GroupChatScreen from '../../features/messages/GroupChatScreen';

/**
 * Simple Discovery Icon - Magnifying glass
 */
function DiscoveryIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View 
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.3,
          borderWidth: 2,
          borderColor: color,
          position: 'relative',
        }}
      />
      <View 
        style={{
          width: size * 0.25,
          height: 2,
          backgroundColor: color,
          position: 'absolute',
          bottom: size * 0.1,
          right: size * 0.1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/**
 * Simple Camera Icon - Camera body with lens
 */
function CameraIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Camera body */}
      <View 
        style={{
          width: size * 0.8,
          height: size * 0.6,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Camera lens */}
        <View 
          style={{
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: size * 0.175,
            borderWidth: 1.5,
            borderColor: color,
          }}
        />
      </View>
      {/* Camera flash */}
      <View 
        style={{
          width: size * 0.15,
          height: size * 0.1,
          backgroundColor: color,
          borderRadius: 2,
          position: 'absolute',
          top: size * 0.15,
          left: size * 0.25,
        }}
      />
    </View>
  );
}

/**
 * Simple Messages Icon - Chat bubble
 */
function MessagesIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Main chat bubble */}
      <View 
        style={{
          width: size * 0.7,
          height: size * 0.55,
          borderRadius: size * 0.15,
          borderWidth: 2,
          borderColor: color,
          position: 'relative',
        }}
      />
      {/* Chat bubble tail */}
      <View 
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.1,
          borderRightWidth: size * 0.1,
          borderTopWidth: size * 0.15,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          position: 'absolute',
          bottom: size * 0.15,
          left: size * 0.15,
        }}
      />
    </View>
  );
}

export type MessagesStackParamList = {
  MessagesList: undefined;
  Friends: undefined;
  Profile: undefined;
  Chat: {
    friendId: string;
    friendUsername: string;
    chatId?: string;
  };
  CreateGroupChat: undefined;
  GroupChat: {
    chatId: string;
    chatName?: string;
  };
};

export type RootTabParamList = {
  Discovery: undefined;
  Camera: undefined;
  Messages: undefined;
};

const MessagesStack = createStackNavigator<MessagesStackParamList>();
const DiscoveryStack = createStackNavigator();
const CameraStack = createStackNavigator();
const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Messages Stack Navigator
 * Contains MessagesScreen, FriendsScreen, and ProfileScreen
 */
function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
      <MessagesStack.Screen name="Friends" component={FriendsScreen} />
      <MessagesStack.Screen name="Profile" component={ProfileScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} />
      <MessagesStack.Screen name="CreateGroupChat" component={CreateGroupChatScreen} />
      <MessagesStack.Screen name="GroupChat" component={GroupChatScreen} />
    </MessagesStack.Navigator>
  );
}

/**
 * Discovery Stack Navigator
 * Stories are now handled inline within DiscoveryScreen
 */
function DiscoveryStackNavigator() {
  return (
    <DiscoveryStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoveryStack.Screen name="DiscoveryMain" component={DiscoveryScreen} />
      <DiscoveryStack.Screen name="StoryCreator" component={StoryCreatorScreen} />
    </DiscoveryStack.Navigator>
  );
}

/**
 * Camera Stack Navigator
 */
function CameraStackNavigator() {
  return (
    <CameraStack.Navigator screenOptions={{ headerShown: false }}>
      <CameraStack.Screen name="CameraMain" component={CameraScreen} />
      <CameraStack.Screen name="StoryCreator" component={StoryCreatorScreen} />
    </CameraStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000', // Pure black for sleek look
          borderTopWidth: 1,
          borderTopColor: '#1F1F1F', // Subtle border
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#0066FF', // Interactive blue
        tabBarInactiveTintColor: '#9CA3AF', // Muted gray
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen 
        name="Discovery" 
        component={DiscoveryStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <DiscoveryIcon color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Camera" 
        component={CameraStackNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📸</Text>
          ),
        }}
      />
      
      <Tab.Screen 
        name="Messages" 
        component={MessagesStackNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessagesIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 