/**
 * Root Navigator
 * 
 * Manages the main navigation flow based on authentication state
 * and sports onboarding completion.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { SportsOnboardingScreen } from '../../features/onboarding/SportsOnboardingScreen';
import { useAuth } from '../../stores/authStore';

export function RootNavigator() {
  const { 
    user, 
    isLoading, 
    isInitialized, 
    needsSportsOnboarding, 
    initialize 
  } = useAuth();

  /**
   * Initialize authentication state on app startup
   */
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>SnapConnect V2</Text>
        <Text style={styles.loadingSubtext}>Loading...</Text>
      </View>
    );
  }

  // Show authentication screens if user is not signed in
  if (!user) {
    return <AuthNavigator />;
  }

  // Show sports onboarding if user needs to complete it
  if (needsSportsOnboarding) {
    return <SportsOnboardingScreen />;
  }

  // Show main app if user is authenticated and onboarded
  return <MainNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#64748b',
  },
}); 