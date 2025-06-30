/**
 * ProfileScreen Component
 * User profile and settings interface
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

export function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  /**
   * Handle sign out
   */
  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.profile?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.profile?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Profile Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          
          <Button
            title="Edit Profile"
            variant="outline"
            style={styles.actionButton}
            onPress={() => console.log('Edit Profile pressed')}
          />
          
          <Button
            title="Favorite Teams"
            variant="outline"
            style={styles.actionButton}
            onPress={() => console.log('Favorite Teams pressed')}
          />
          
          <Button
            title="Notifications"
            variant="outline"
            style={styles.actionButton}
            onPress={() => console.log('Notifications pressed')}
          />
          
          <Button
            title="Privacy Settings"
            variant="outline"
            style={styles.actionButton}
            onPress={() => console.log('Privacy Settings pressed')}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Stats</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
            style={[styles.actionButton, styles.signOutButton]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black instead of slate-900
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF', // Interactive blue instead of blue-500
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF', // Updated to match our theme tertiary text
  },
  section: {
    backgroundColor: '#111111', // Dark elevated black instead of slate-800
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Dark border medium instead of slate-700
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  signOutButton: {
    borderColor: '#ef4444', // Keep red for destructive action
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF', // Updated to match our theme tertiary text
    textTransform: 'uppercase',
  },
}); 