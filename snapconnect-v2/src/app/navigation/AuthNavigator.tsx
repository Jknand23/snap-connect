/**
 * Auth Navigator
 * 
 * Manages the authentication flow including login, signup, 
 * and password recovery screens.
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../../features/auth/LoginScreen';

export type AuthStackParamList = {
  Login: undefined;
  // Add more auth screens here in the future
  // ForgotPassword: undefined;
  // VerifyEmail: { email: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
    </Stack.Navigator>
  );
} 