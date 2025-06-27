/**
 * Authentication Service
 * 
 * Handles user authentication, registration, and profile management
 * with integration to sports onboarding and user preferences.
 */
import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type UserSportsPreferences = Database['public']['Tables']['user_sports_preferences']['Row'];

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  sportsPreferences: UserSportsPreferences | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SportsOnboardingData {
  favoriteTeams: string[];
  favoritePlayers: string[];
  preferredLeagues: string[];
  notificationPreferences: {
    gameAlerts: boolean;
    newsUpdates: boolean;
    friendActivity: boolean;
  };
}

/**
 * Authentication service with sports-specific functionality
 */
export class AuthService {
  /**
   * Test Supabase connection and configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing Supabase connection...');
      
      // Test if we can reach Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return {
          success: false,
          message: `Connection failed: ${error.message}`,
        };
      }
      
      console.log('Supabase connection successful');
      return {
        success: true,
        message: 'Supabase connection is working',
      };
    } catch (error: any) {
      console.error('Supabase connection test error:', error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  /**
   * Test database schema and tables
   */
  async testDatabaseSchema(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      console.log('Testing database schema...');
      
      const results: any = {};
      
      // Test profiles table
      try {
        const { data: profilesTest, error: profilesError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });
        
        results.profiles = profilesError 
          ? { error: profilesError.message } 
          : { success: true, count: profilesTest };
      } catch (error: any) {
        results.profiles = { error: error.message };
      }

      // Test user_sports_preferences table
      try {
        const { data: prefsTest, error: prefsError } = await supabase
          .from('user_sports_preferences')
          .select('count', { count: 'exact', head: true });
        
        results.user_sports_preferences = prefsError 
          ? { error: prefsError.message } 
          : { success: true, count: prefsTest };
      } catch (error: any) {
        results.user_sports_preferences = { error: error.message };
      }

      // Test teams table
      try {
        const { data: teamsTest, error: teamsError } = await supabase
          .from('teams')
          .select('count', { count: 'exact', head: true });
        
        results.teams = teamsError 
          ? { error: teamsError.message } 
          : { success: true, count: teamsTest };
      } catch (error: any) {
        results.teams = { error: error.message };
      }

      console.log('Database schema test results:', results);

      const hasErrors = Object.values(results).some((result: any) => result.error);
      
      return {
        success: !hasErrors,
        message: hasErrors 
          ? 'Some database tables have issues' 
          : 'All database tables accessible',
        details: results,
      };
    } catch (error: any) {
      console.error('Database schema test error:', error);
      return {
        success: false,
        message: `Schema test failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Register a new user with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            full_name: credentials.fullName || '',
            avatar_url: credentials.avatarUrl || '',
          },
        },
      });

      if (error) {
        // Log the exact error for debugging
        console.error('Raw Supabase signup error:', {
          message: error.message,
          status: error.status,
          statusCode: error.status,
          details: error,
        });
        
        // Provide more specific error messages
        let errorMessage = 'Sign up failed';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password format';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else if (error.message.includes('Email')) {
          errorMessage = `Email validation failed. Original error: ${error.message}`;
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again';
        } else if (error.message.includes('Invalid API key') || error.message.includes('Project not found')) {
          errorMessage = 'App configuration error. Please contact support';
        } else {
          errorMessage = `Sign up failed: ${error.message}`;
        }
        
        console.error('Processed error message:', errorMessage);
        throw new DatabaseError(errorMessage, error);
      }

      if (!data.user) {
        throw new DatabaseError('User creation failed - no user data returned');
      }

      // The profile will be created automatically by the database trigger
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      return await this.getCurrentUser();
    } catch (error: any) {
      console.error('Auth service signup error:', error);
      
      // If it's already a DatabaseError, just throw it
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      // Handle other errors
      if (error.message?.includes('fetch')) {
        throw new DatabaseError('Network connection failed. Please check your internet connection');
      }
      
      throw new DatabaseError('Sign up failed. Please try again', error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new DatabaseError('Sign in failed', error);
      }

      if (!data.user) {
        throw new DatabaseError('Authentication failed');
      }

      return await this.getCurrentUser();
    } catch (error) {
      throw new DatabaseError('Sign in failed', error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new DatabaseError('Sign out failed', error);
      }
    } catch (error) {
      throw new DatabaseError('Sign out failed', error);
    }
  }

  /**
   * Get current authenticated user with profile and sports preferences
   */
  async getCurrentUser(): Promise<AuthUser> {
    try {
      console.log('Getting current user...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Check if it's a missing session error (normal for unauthenticated users)
        if (error.message.includes('session missing') || error.message.includes('Auth session missing')) {
          console.log('📱 No auth session found - user is not signed in');
          throw new DatabaseError('User not authenticated', error);
        }
        console.error('Failed to get auth user:', error);
        throw new DatabaseError('Failed to get user', error);
      }

      if (!user) {
        console.log('📱 No authenticated user found');
        throw new DatabaseError('No authenticated user');
      }

      console.log('Auth user found:', { id: user.id, email: user.email });

      // Get user profile
      console.log('Fetching user profile for ID:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile query result:', { 
        profile, 
        error: profileError,
        errorCode: profileError?.code 
      });

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch failed:', profileError);
        throw new DatabaseError(`Failed to get user profile: ${profileError.message}`, profileError);
      }

      // Get sports preferences
      console.log('Fetching sports preferences for user ID:', user.id);
      const { data: sportsPreferences, error: prefsError } = await supabase
        .from('user_sports_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Sports preferences query result:', { 
        sportsPreferences, 
        error: prefsError,
        errorCode: prefsError?.code 
      });

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Sports preferences fetch failed:', prefsError);
        throw new DatabaseError(`Failed to get sports preferences: ${prefsError.message}`, prefsError);
      }

      const result = {
        id: user.id,
        email: user.email || '',
        profile: profile || null,
        sportsPreferences: sportsPreferences || null,
      };

      console.log('getCurrentUser successful:', result);
      return result;
    } catch (error: any) {
      // Only log as error if it's not a missing session (which is normal)
      if (!error.message?.includes('session missing') && !error.message?.includes('not authenticated')) {
        console.error('getCurrentUser failed:', error);
      }
      throw new DatabaseError(`Failed to get current user: ${error.message}`, error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<ProfileInsert>): Promise<Profile> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update profile', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to update profile', error);
    }
  }

  /**
   * Complete sports onboarding for new user
   */
  async completeSportsOnboarding(onboardingData: SportsOnboardingData): Promise<UserSportsPreferences> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('user_sports_preferences')
        .upsert({
          user_id: userId,
          favorite_teams: onboardingData.favoriteTeams,
          favorite_players: onboardingData.favoritePlayers,
          preferred_leagues: onboardingData.preferredLeagues,
          notification_preferences: onboardingData.notificationPreferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to save sports preferences', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to complete sports onboarding', error);
    }
  }

  /**
   * Update sports preferences
   */
  async updateSportsPreferences(preferencesData: Partial<SportsOnboardingData>): Promise<UserSportsPreferences> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (preferencesData.favoriteTeams) {
        updateData.favorite_teams = preferencesData.favoriteTeams;
      }
      if (preferencesData.favoritePlayers) {
        updateData.favorite_players = preferencesData.favoritePlayers;
      }
      if (preferencesData.preferredLeagues) {
        updateData.preferred_leagues = preferencesData.preferredLeagues;
      }
      if (preferencesData.notificationPreferences) {
        updateData.notification_preferences = preferencesData.notificationPreferences;
      }

      const { data, error } = await supabase
        .from('user_sports_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update sports preferences', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to update sports preferences', error);
    }
  }

  /**
   * Check if user has completed sports onboarding
   */
  async hasSportsOnboarding(): Promise<boolean> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('user_sports_preferences')
        .select('favorite_teams')
        .eq('user_id', userId)
        .single();

      if (error) {
        return false;
      }

      return data?.favorite_teams && data.favorite_teams.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const user = await this.getCurrentUser();
          callback(user);
        } catch (error) {
          console.error('Error getting user on auth change:', error);
          callback(null);
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
}

// Export singleton instance
export const authService = new AuthService(); 