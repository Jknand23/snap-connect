/**
 * Main App entry point
 * Sets up navigation container and initial app structure
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './navigation/RootNavigator';
import 'react-native-url-polyfill/auto';
import '../../global.css';

export default function App() {
  useEffect(() => {
    // Initialize disappearing messages integration service
    const initializeServices = async () => {
      try {
        const { disappearingMessagesIntegration } = await import('../services/messaging/disappearingMessagesIntegration');
        await disappearingMessagesIntegration.initialize();
        console.log('✅ App services initialized');
      } catch (error) {
        console.error('❌ Failed to initialize app services:', error);
      }
    };

    initializeServices();

    // Cleanup on app unmount
    return () => {
      const cleanup = async () => {
        try {
          const { disappearingMessagesIntegration } = await import('../services/messaging/disappearingMessagesIntegration');
          await disappearingMessagesIntegration.shutdown();
        } catch (error) {
          console.error('❌ Failed to cleanup app services:', error);
        }
      };
      cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 