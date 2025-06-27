/**
 * Communities Screen
 * Fan communities and team-based group interactions with real communities integration
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { communitiesService, CommunityWithDetails } from '../../services/messaging/communitiesService';

type CommunitiesStackParamList = {
  Communities: undefined;
  CommunityChat: {
    communityId: string;
    communityName: string;
    communityEmoji: string;
    communityType: 'team' | 'league';
  };
};

type CommunitiesNavigationProp = StackNavigationProp<CommunitiesStackParamList, 'Communities'>;

export function CommunitiesScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<CommunitiesNavigationProp>();
  const [selectedTab, setSelectedTab] = useState<'my' | 'discover' | 'live'>('my');
  const [myCommunities, setMyCommunities] = useState<CommunityWithDetails[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<CommunityWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load user's communities
   */
  const loadMyCommunities = useCallback(async () => {
    try {
      const communities = await communitiesService.getUserCommunities();
      setMyCommunities(communities);
    } catch (error) {
      console.error('Error loading my communities:', error);
      Alert.alert('Error', 'Failed to load your communities');
    }
  }, []);

  /**
   * Load available communities
   */
  const loadAvailableCommunities = useCallback(async () => {
    try {
      const communities = await communitiesService.getAvailableCommunities();
      setAvailableCommunities(communities);
    } catch (error) {
      console.error('Error loading available communities:', error);
      Alert.alert('Error', 'Failed to load available communities');
    }
  }, []);

  /**
   * Load all data
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMyCommunities(),
        loadAvailableCommunities(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadMyCommunities, loadAvailableCommunities]);

  /**
   * Refresh data
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Join community action
   */
  const joinCommunity = async (communityId: string) => {
    try {
      await communitiesService.joinCommunity(communityId);
      await loadData(); // Refresh data
      Alert.alert('Success', 'Joined community successfully!');
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community');
    }
  };

  /**
   * Open community chat
   */
  const openCommunityChat = (community: CommunityWithDetails) => {
    navigation.navigate('CommunityChat', {
      communityId: community.id,
      communityName: community.name,
      communityEmoji: community.emoji,
      communityType: community.type,
    });
  };

  /**
   * Get filtered communities based on selected tab
   */
  const getFilteredCommunities = (): CommunityWithDetails[] => {
    switch (selectedTab) {
      case 'my':
        return myCommunities;
      case 'live':
        return [...myCommunities, ...availableCommunities].filter(c => 
          c.last_message && 
          new Date(c.last_message.created_at) > new Date(Date.now() - 30 * 60 * 1000) // Active in last 30 minutes
        );
      case 'discover':
        return availableCommunities;
      default:
        return myCommunities;
    }
  };

  /**
   * Format member count
   */
  const formatMemberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  /**
   * Get last activity text
   */
  const getLastActivityText = (community: CommunityWithDetails): string => {
    if (!community.last_message) {
      return 'No recent activity';
    }

    const now = new Date();
    const messageTime = new Date(community.last_message.created_at);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return messageTime.toLocaleDateString();
  };

  /**
   * Render community card
   */
  const renderCommunityCard = (community: CommunityWithDetails) => {
    const isJoined = community.is_member;
    const hasUnread = community.unread_count && community.unread_count > 0;
    
    return (
      <TouchableOpacity 
        key={community.id} 
        style={styles.communityCard}
        onPress={() => isJoined ? openCommunityChat(community) : undefined}
        disabled={!isJoined}
      >
        <View style={styles.communityHeader}>
          <View style={styles.communityInfo}>
            <View style={styles.communityTitleRow}>
              <Text style={styles.communityEmoji}>{community.emoji}</Text>
              <Text style={styles.communityName}>{community.name}</Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{community.unread_count}</Text>
                </View>
              )}
            </View>
            <Text style={styles.communityMeta}>
              {community.league} • {formatMemberCount(community.member_count)} members
            </Text>
            <Text style={styles.lastActivity}>
              {getLastActivityText(community)}
            </Text>
            {community.last_message && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {community.last_message.sender_username}: {community.last_message.content}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.communityActions}>
          {isJoined ? (
            <Button
              title="Chat"
              variant="primary"
              size="sm"
              onPress={() => openCommunityChat(community)}
            />
          ) : (
            <Button
              title="Join"
              variant="outline"
              size="sm"
              onPress={() => joinCommunity(community.id)}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <Text style={styles.subtitle}>Connect with fellow sports fans</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'my' && styles.activeTab]}
          onPress={() => setSelectedTab('my')}
        >
          <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
            My Communities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'live' && styles.activeTab]}
          onPress={() => setSelectedTab('live')}
        >
          <Text style={[styles.tabText, selectedTab === 'live' && styles.activeTabText]}>
            Live Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'discover' && styles.activeTab]}
          onPress={() => setSelectedTab('discover')}
        >
          <Text style={[styles.tabText, selectedTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Communities List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {selectedTab === 'my' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏟️ Your Teams</Text>
            <Text style={styles.sectionSubtitle}>
              Communities for teams you follow
            </Text>
          </View>
        )}

        {selectedTab === 'live' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Live Discussions</Text>
            <Text style={styles.sectionSubtitle}>
              Active conversations happening now
            </Text>
          </View>
        )}

        {selectedTab === 'discover' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Discover</Text>
            <Text style={styles.sectionSubtitle}>
              Join new communities based on your teams
            </Text>
          </View>
        )}

        {/* Communities Grid */}
        <View style={styles.communitiesContainer}>
          {getFilteredCommunities().map(renderCommunityCard)}
        </View>

        {getFilteredCommunities().length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {selectedTab === 'my' ? 'No Communities Yet' : 'No Communities Available'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'my' 
                ? 'Join communities to start connecting with fellow fans'
                : 'Check back later for new communities to join'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  communitiesContainer: {
    paddingHorizontal: 20,
  },
  communityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityHeader: {
    flex: 1,
  },
  communityInfo: {
    flex: 1,
  },
  communityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  communityMeta: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  lastActivity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  communityActions: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 