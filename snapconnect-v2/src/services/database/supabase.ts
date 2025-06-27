/**
 * Supabase Client Configuration
 * 
 * Core database client setup with TypeScript types and error handling
 * for the SnapConnect V2 sports social media app.
 */
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Database } from '../../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    url: supabaseUrl ? 'configured' : 'missing',
    key: supabaseAnonKey ? 'configured' : 'missing'
  });
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.'
  );
}

if (supabaseUrl.includes('your_supabase_project_url') || supabaseAnonKey.includes('your_supabase_anon_key')) {
  throw new Error(
    'Please replace the placeholder values in your .env file with your actual Supabase project URL and API key.'
  );
}

/**
 * Configured Supabase client with TypeScript database types
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Database service error handler
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Common database operations utility
 */
export const dbUtils = {
  /**
   * Handle database response with proper error handling
   */
  handleResponse: <T>(response: { data: T | null; error: any }) => {
    if (response.error) {
      throw new DatabaseError('Database operation failed', response.error);
    }
    return response.data;
  },

  /**
   * Get current user ID or throw error
   */
  getCurrentUserId: async (): Promise<string> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new DatabaseError('User not authenticated');
    }
    return user.id;
  },
}; 