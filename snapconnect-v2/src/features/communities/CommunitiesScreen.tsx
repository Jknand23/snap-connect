/**
 * Communities Screen
 * Fan communities and team-based group interactions
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

interface Community {
  id: string;
  name: string;
  type: 'team' | 'league' | 'general';
  league: string;
  memberCount: number;
  isLive: boolean;
  lastActivity: string;
  emoji: string;
}

const SAMPLE_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Dallas Cowboys',
    type: 'team',
    league: 'NFL',
    memberCount: 45230,
    isLive: true,
    lastActivity: '2 min ago',
    emoji: '🏈'
  },
  {
    id: '2',
    name: 'Los Angeles Lakers',
    type: 'team',
    league: 'NBA',
    memberCount: 67890,
    isLive: false,
    lastActivity: '15 min ago',
    emoji: '🏀'
  },
  {
    id: '3',
    name: 'New York Yankees',
    type: 'team',
    league: 'MLB',
    memberCount: 52000,
    isLive: false,
    lastActivity: '1 hour ago',
    emoji: '⚾'
  },
  {
    id: '4',
    name: 'NFL Fantasy Football',
    type: 'general',
    league: 'NFL',
    memberCount: 128500,
    isLive: true,
    lastActivity: 'Just now',
    emoji: '🏆'
  },
  {
    id: '5',
    name: 'NBA Trade Rumors',
    type: 'general',
    league: 'NBA',
    memberCount: 89200,
    isLive: true,
    lastActivity: '5 min ago',
    emoji: '📰'
  },
];

export function CommunitiesScreen() {
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'my' | 'discover' | 'live'>('my');

  /**
   * Filter communities based on selected tab
   */
  function getFilteredCommunities() {
    switch (selectedTab) {
      case 'my':
        return SAMPLE_COMMUNITIES.slice(0, 3); // User's joined communities
      case 'live':
        return SAMPLE_COMMUNITIES.filter(c => c.isLive);
      case 'discover':
        return SAMPLE_COMMUNITIES;
      default:
        return SAMPLE_COMMUNITIES;
    }
  }

  /**
   * Join community action
   */
  function joinCommunity(communityId: string) {
    // TODO: Implement actual join functionality
    console.log('Joining community:', communityId);
  }

  /**
   * Render community card
   */
  function renderCommunityCard(community: Community) {
    const isJoined = selectedTab === 'my';
    
    return (
      <TouchableOpacity key={community.id} style={styles.communityCard}>
        <View style={styles.communityHeader}>
          <View style={styles.communityInfo}>
            <View style={styles.communityTitleRow}>
              <Text style={styles.communityEmoji}>{community.emoji}</Text>
              <Text style={styles.communityName}>{community.name}</Text>
              {community.isLive && (
                <View style={styles.liveIndicator}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.communityMeta}>
              {community.league} • {community.memberCount.toLocaleString()} members
            </Text>
            <Text style={styles.lastActivity}>Last activity: {community.lastActivity}</Text>
          </View>
        </View>
        
        <View style={styles.communityActions}>
          {isJoined ? (
            <Button
              title="View"
              variant="primary"
              size="sm"
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="Join"
              variant="outline"
              size="sm"
              onPress={() => joinCommunity(community.id)}
              style={styles.actionButton}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }

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
      <ScrollView style={styles.content}>
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
            <Text style={styles.sectionTitle}>🔍 Discover Communities</Text>
            <Text style={styles.sectionSubtitle}>
              Find new communities to join
            </Text>
          </View>
        )}

        {getFilteredCommunities().map(renderCommunityCard)}

        {/* Create Community Button */}
        <View style={styles.createSection}>
          <Button
            title="Create New Community"
            variant="outline"
            style={styles.createButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  communityCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    marginBottom: 4,
  },
  communityEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  liveIndicator: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  communityMeta: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 11,
    color: '#475569',
  },
  communityActions: {
    marginLeft: 12,
  },
  actionButton: {
    minWidth: 60,
  },
  createSection: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  createButton: {
    paddingHorizontal: 32,
  },
}); 