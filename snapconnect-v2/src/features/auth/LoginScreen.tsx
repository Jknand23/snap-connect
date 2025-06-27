/**
 * Login Screen
 * 
 * Handles user authentication with sign in and sign up functionality.
 * Features modern UI design with form validation and error handling.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../stores/authStore';
import { authService } from '../../services/auth/authService';

interface FormData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  username?: string;
  fullName?: string;
}

export function LoginScreen() {
  const { signIn, signUp, isLoading, error, clearError } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: '',
    fullName: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validate form data
   */
  function validateForm(): boolean {
    const errors: FormErrors = {};

    // Email validation - basic check, let Supabase handle detailed validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!formData.email.includes('@') || formData.email.length < 5) {
      errors.email = 'Please enter a valid email address';
      console.log('Email validation failed for:', formData.email.trim());
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Sign up specific validations
    if (isSignUp) {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }

      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit() {
    console.log('Submit pressed, form data:', {
      email: formData.email,
      username: formData.username,
      fullName: formData.fullName,
      isSignUp,
    });
    
    clearError();
    
    if (!validateForm()) {
      console.log('Form validation failed, errors:', formErrors);
      return;
    }

    console.log('Form validation passed, attempting authentication...');

    try {
      if (isSignUp) {
        console.log('Attempting sign up with:', {
          email: formData.email.trim(),
          username: formData.username.trim().toLowerCase(),
          fullName: formData.fullName.trim(),
        });
        
        await signUp({
          email: formData.email.trim(),
          password: formData.password,
          username: formData.username.trim().toLowerCase(),
          fullName: formData.fullName.trim(),
        });
        
        // If we get here, signup was successful
        Alert.alert('Success!', 'Account created successfully!');
        
      } else {
        console.log('Attempting sign in with email:', formData.email.trim());
        
        await signIn({
          email: formData.email.trim(),
          password: formData.password,
        });
        
        // If we get here, signin was successful
        Alert.alert('Success!', 'Signed in successfully!');
      }
    } catch (error: any) {
      // Error is handled by the auth store, but let's also show detailed error
      console.error('Authentication error:', error);
      
      // Show detailed error in alert for debugging
      Alert.alert(
        'Authentication Error',
        `${error.message || error}\n\nCheck if you've run the database migration scripts.`,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Toggle between sign in and sign up
   */
  function toggleAuthMode() {
    setIsSignUp(!isSignUp);
    setFormErrors({});
    clearError();
    
    // Clear sign up specific fields when switching to sign in
    if (isSignUp) {
      setFormData(prev => ({
        ...prev,
        username: '',
        fullName: '',
      }));
    }
  }

  /**
   * Update form data
   */
  function updateFormData(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  /**
   * Test Supabase connection
   */
  async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
      const result = await authService.testConnection();
      Alert.alert(
        'Connection Test',
        result.message,
        [{ text: 'OK' }]
      );
      console.log('Connection test result:', result);
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert(
        'Connection Test Failed',
        'Could not test connection. Check console for details.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Test database schema
   */
  async function testDatabase() {
    console.log('Testing database schema...');
    try {
      const result = await authService.testDatabaseSchema();
      
      // Show detailed results in alert
      const detailsText = Object.entries(result.details)
        .map(([table, info]: [string, any]) => {
          if (info.error) {
            return `❌ ${table}: ${info.error}`;
          } else {
            return `✅ ${table}: OK`;
          }
        })
        .join('\n');
      
      Alert.alert(
        'Database Test Results',
        `${result.message}\n\n${detailsText}`,
        [{ text: 'OK' }]
      );
      console.log('Database test result:', result);
    } catch (error) {
      console.error('Database test failed:', error);
      Alert.alert(
        'Database Test Failed',
        `Error: ${error}`,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Render form input
   */
  function renderInput({
    label,
    field,
    placeholder,
    secureTextEntry = false,
    autoCapitalize = 'none',
    autoComplete,
    keyboardType = 'default',
  }: {
    label: string;
    field: keyof FormData;
    placeholder: string;
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: string;
    keyboardType?: 'default' | 'email-address';
  }) {
    const hasError = !!formErrors[field];
    
    return (
      <View className="mb-4">
        <Text className="text-gray-300 text-sm font-medium mb-2">
          {label}
        </Text>
        
        <View className="relative">
          <TextInput
            value={formData[field]}
            onChangeText={(value) => updateFormData(field, value)}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={secureTextEntry && !showPassword}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete as any}
            keyboardType={keyboardType}
            className={`bg-gray-800 border-2 rounded-lg px-4 py-3 text-white text-base ${
              hasError ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            editable={!isLoading}
          />
          
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3"
            >
              <Text className="text-gray-400">
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {hasError && (
          <Text className="text-red-500 text-sm mt-1">
            {formErrors[field]}
          </Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-1 justify-center py-12">
            <View className="items-center mb-8">
              <Text className="text-white text-4xl font-bold mb-2">
                SnapConnect V2
              </Text>
              <Text className="text-gray-400 text-lg text-center">
                {isSignUp 
                  ? 'Join the sports community' 
                  : 'Connect with sports fans'}
              </Text>
            </View>

            {/* Error Display */}
            {error && (
              <View className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                <Text className="text-red-500 text-center">
                  {error}
                </Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-4">
              {renderInput({
                label: 'Email',
                field: 'email',
                placeholder: 'Enter your email',
                keyboardType: 'email-address',
                autoComplete: 'email',
              })}

              {isSignUp && renderInput({
                label: 'Username',
                field: 'username',
                placeholder: 'Choose a username',
                autoComplete: 'username',
              })}

              {isSignUp && renderInput({
                label: 'Full Name',
                field: 'fullName',
                placeholder: 'Enter your full name',
                autoCapitalize: 'words',
                autoComplete: 'name',
              })}

              {renderInput({
                label: 'Password',
                field: 'password',
                placeholder: 'Enter your password',
                secureTextEntry: true,
                autoComplete: isSignUp ? 'new-password' : 'current-password',
              })}

              {/* Submit Button */}
              <View className="mt-8">
                <Button
                  title={isSignUp ? 'Create Account' : 'Sign In'}
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading}
                />
                
                {/* Debug: Test Connection Button */}
                <View className="mt-4 space-y-2">
                  <Button
                    title="Test Supabase Connection"
                    onPress={testConnection}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  />
                  <Button
                    title="Test Database Schema"
                    onPress={testDatabase}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  />
                </View>
              </View>

              {/* Auth Mode Toggle */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-gray-400">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity
                  onPress={toggleAuthMode}
                  disabled={isLoading}
                  className="ml-2"
                >
                  <Text className="text-blue-500 font-semibold">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Features Preview */}
            <View className="mt-12 space-y-4">
              <Text className="text-gray-300 text-center font-semibold">
                What's waiting for you:
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">🏈</Text>
                  <Text className="text-gray-400 flex-1">
                    Follow your favorite teams and get personalized updates
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">📱</Text>
                  <Text className="text-gray-400 flex-1">
                    Share sports moments with team-themed AR filters
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">💬</Text>
                  <Text className="text-gray-400 flex-1">
                    Chat with fellow fans during live games
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 