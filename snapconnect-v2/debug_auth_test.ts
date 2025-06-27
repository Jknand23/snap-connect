/**
 * Debug Script: Authentication Test
 * 
 * This script helps debug authentication-related issues by testing:
 * 1. Supabase connection
 * 2. Authentication state
 * 3. Auth service functionality
 */

import { authService } from './src/services/auth/authService';
import { supabase } from './src/services/database/supabase';

export async function debugAuthTest() {
  console.log('🧪 Starting authentication debug test...');
  
  try {
    // Test 1: Check Supabase connection
    console.log('\n1. Testing Supabase connection...');
    const connectionTest = await authService.testConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest.success) {
      console.error('❌ Supabase connection failed. Check your environment variables.');
      return;
    }
    
    // Test 2: Check current auth session
    console.log('\n2. Testing current auth session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else if (session) {
      console.log('✅ Active session found:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });
    } else {
      console.log('📱 No active session (user is not signed in)');
    }
    
    // Test 3: Try to get current user
    console.log('\n3. Testing getCurrentUser...');
    try {
      const user = await authService.getCurrentUser();
      console.log('✅ Current user:', {
        id: user.id,
        email: user.email,
        hasProfile: !!user.profile,
        hasSportsPrefs: !!user.sportsPreferences
      });
    } catch (error: any) {
      if (error.message.includes('not authenticated') || error.message.includes('session missing')) {
        console.log('📱 No authenticated user (this is normal if not signed in)');
      } else {
        console.error('❌ Error getting current user:', error.message);
      }
    }
    
    // Test 4: Check database schema
    console.log('\n4. Testing database schema...');
    const schemaTest = await authService.testDatabaseSchema();
    console.log('Schema test result:', schemaTest.success ? '✅ All tables exist' : '❌ Missing tables');
    
    if (!schemaTest.success) {
      console.log('Missing tables details:', schemaTest.details);
    }
    
    // Test 5: Test auth state listener
    console.log('\n5. Testing auth state listener...');
    const { data } = authService.onAuthStateChange((user) => {
      if (user) {
        console.log('🔄 Auth state changed: User signed in:', user.email);
      } else {
        console.log('🔄 Auth state changed: User signed out');
      }
    });
    
    // Clean up listener after a short delay
    setTimeout(() => {
      if (data?.subscription) {
        data.subscription.unsubscribe();
        console.log('✅ Auth state listener test completed');
      }
    }, 1000);
    
    console.log('\n🎉 Authentication test completed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  }
}

// Make it available globally for debugging
if (typeof global !== 'undefined') {
  (global as any).debugAuthTest = debugAuthTest;
}

console.log('💡 To run this test, call: debugAuthTest()'); 