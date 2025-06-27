/**
 * HomeScreen Component
 * 
 * Main dashboard displaying personalized sports content feed with live updates,
 * team news, and friend activity. Features sleek, modern design.
 */

import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';

/**
 * Main home screen with personalized sports content feed
 */
export function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-dark-bg-primary">
      <ScrollView className="flex-1 px-4">
        {/* Header Section - Sleek and minimal */}
        <View className="section-header pt-4 pb-2">
          <View>
            <Text className="headline-2 text-dark-text-primary">Feed</Text>
            <Text className="caption text-dark-text-tertiary">Latest from your teams</Text>
          </View>
          <View className="status-live" />
        </View>

        {/* Live Game Alert - Sharp design */}
        <View className="card-live mb-4 p-4">
          <View className="flex-row items-center mb-2">
            <View className="sports-indicator bg-live-indicator" />
            <Text className="live-badge">LIVE</Text>
            <Text className="caption text-dark-text-tertiary ml-auto">Q3 8:42</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="body-medium text-dark-text-primary">Lakers vs Warriors</Text>
              <Text className="score-display text-team-primary">98-92</Text>
            </View>
            <Button 
              title="Watch" 
              variant="primary" 
              size="sm"
            />
          </View>
        </View>

        {/* Stories Section - Horizontal scroll */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-white font-semibold">Stories</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {/* Add Story Button */}
            <TouchableOpacity className="items-center mr-4">
              <View className="w-16 h-16 bg-gray-700 rounded-full items-center justify-center ring-2 ring-gray-600">
                <Text className="text-white text-2xl">+</Text>
              </View>
              <Text className="text-xs text-white mt-1">Your Story</Text>
            </TouchableOpacity>
            
            {/* Sample Story Items */}
            <TouchableOpacity className="items-center mr-4">
              <View className="relative ring-2 ring-blue-500 rounded-full p-1">
                <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center">
                  <Text className="text-white text-xs">🏀</Text>
                </View>
                <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
              </View>
              <Text className="text-xs text-white mt-1">Mike</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center mr-4">
              <View className="relative ring-2 ring-gray-600 rounded-full p-1">
                <View className="w-16 h-16 bg-green-600 rounded-full items-center justify-center">
                  <Text className="text-white text-xs">🏈</Text>
                </View>
              </View>
              <Text className="text-xs text-white mt-1">Sarah</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Quick Actions - Minimal grid */}
        <View className="action-row mb-6">
          <Button 
            title="Camera" 
            variant="glass" 
            size="small"
            className="flex-1 mr-2"
          />
          <Button 
            title="Teams" 
            variant="team" 
            size="small"
            className="flex-1 mx-1"
          />
          <Button 
            title="Discover" 
            variant="outline" 
            size="small"
            className="flex-1 ml-2"
          />
        </View>

        {/* Content Feed - Clean minimal cards */}
        <View className="content-grid">
          
          {/* Breaking News - Sharp highlight */}
          <View className="card-news p-3 mb-2">
            <View className="flex-row items-center mb-1">
              <Text className="team-badge">NBA</Text>
              <Text className="caption text-dark-text-tertiary ml-auto">2h ago</Text>
            </View>
            <Text className="body-medium text-dark-text-primary">
              LeBron James reaches 40,000 career points milestone
            </Text>
          </View>

          {/* Friend Activity - Minimal design */}
          <View className="card-minimal mb-2">
            <View className="flex-row items-center mb-1">
              <View className="status-online mr-2" />
              <Text className="body-small text-dark-text-secondary">Mike shared a story</Text>
              <Text className="caption text-dark-text-tertiary ml-auto">5m</Text>
            </View>
            <Text className="caption text-dark-text-tertiary">Warriors pre-game warmup</Text>
          </View>

          {/* Team Update - Clean layout */}
          <View className="card-sleek mb-2 p-3">
            <View className="flex-row items-center mb-2">
              <View className="sports-indicator bg-team-primary" />
              <Text className="label text-dark-text-tertiary">Your Team</Text>
            </View>
            <Text className="body-medium text-dark-text-primary mb-1">
              Warriors injury report: Curry probable for tonight
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="caption text-dark-text-tertiary">Official update</Text>
              <Button 
                title="Read" 
                variant="minimal" 
                size="small"
              />
            </View>
          </View>

          {/* Trending - Sophisticated highlight */}
          <View className="card-interactive mb-2 p-3">
            <View className="flex-row items-center mb-2">
              <Text className="label text-interactive">Trending</Text>
              <View className="glow-effect ml-auto" />
            </View>
            <Text className="body-medium text-dark-text-primary mb-1">
              #DubNation reactions to last night's clutch win
            </Text>
            <Text className="caption text-dark-text-tertiary">12.4k fans discussing</Text>
          </View>

          {/* Game Highlights - Sleek preview */}
          <View className="card-sleek mb-2 p-3">
            <View className="flex-row items-center mb-2">
              <Text className="sports-badge">Highlights</Text>
              <Text className="caption text-dark-text-tertiary ml-auto">Yesterday</Text>
            </View>
            <Text className="body-medium text-dark-text-primary mb-1">
              Top 10 plays from Lakers vs Celtics
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="caption text-dark-text-tertiary">3:24 • ESPN</Text>
              <Button 
                title="Play" 
                variant="team" 
                size="small"
              />
            </View>
          </View>

          {/* Community Activity - Minimal social */}
          <View className="card-minimal mb-2">
            <View className="flex-row items-center mb-1">
              <Text className="body-small text-dark-text-secondary">Sarah, Alex +8 others</Text>
            </View>
            <Text className="caption text-dark-text-tertiary">
              Joined Lakers Game Discussion
            </Text>
          </View>

        </View>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
} 