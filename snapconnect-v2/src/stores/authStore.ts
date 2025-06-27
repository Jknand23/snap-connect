/**
 * Authentication Store
 * 
 * Manages user authentication state using Zustand with integration
 * to the AuthService for complete user management and sports onboarding.
 */
import { create } from 'zustand';
import { authService, AuthUser, SignUpCredentials, SignInCredentials, SportsOnboardingData } from '../services/auth/authService';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  needsSportsOnboarding: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  completeSportsOnboarding: (data: SportsOnboardingData) => Promise<void>;
  updateSportsPreferences: (data: Partial<SportsOnboardingData>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  needsSportsOnboarding: false,

  /**
   * Initialize authentication state and set up listener
   */
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current user if authenticated
      try {
        const user = await authService.getCurrentUser();
        const needsOnboarding = !(await authService.hasSportsOnboarding());
        
        set({ 
          user, 
          needsSportsOnboarding: needsOnboarding,
          isLoading: false,
          isInitialized: true,
        });
      } catch (error: any) {
        // Handle missing session gracefully - this is normal for unauthenticated users
        console.log('📱 No authenticated session found (this is normal for new/signed-out users)');
        set({ 
          user: null, 
          needsSportsOnboarding: false,
          isLoading: false,
          isInitialized: true,
        });
      }

      // Set up auth state listener
      authService.onAuthStateChange((user) => {
        if (user) {
          authService.hasSportsOnboarding().then(hasOnboarding => {
            set({ 
              user, 
              needsSportsOnboarding: !hasOnboarding,
              isLoading: false,
            });
          }).catch(error => {
            console.error('Error checking sports onboarding:', error);
            set({ 
              user, 
              needsSportsOnboarding: true, // Default to needing onboarding on error
              isLoading: false,
            });
          });
        } else {
          set({ 
            user: null, 
            needsSportsOnboarding: false,
            isLoading: false,
          });
        }
      });

    } catch (error: any) {
      console.error('❌ Authentication initialization failed:', error);
      set({ 
        error: error.message || 'Failed to initialize authentication',
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Register a new user
   */
  signUp: async (credentials: SignUpCredentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const user = await authService.signUp(credentials);
      
      set({ 
        user,
        needsSportsOnboarding: true, // New users always need onboarding
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Sign up failed',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Sign in existing user
   */
  signIn: async (credentials: SignInCredentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const user = await authService.signIn(credentials);
      const needsOnboarding = !(await authService.hasSportsOnboarding());
      
      set({ 
        user,
        needsSportsOnboarding: needsOnboarding,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Sign in failed',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      await authService.signOut();
      
      set({ 
        user: null,
        needsSportsOnboarding: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Sign out failed',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Complete sports onboarding for new user
   */
  completeSportsOnboarding: async (data: SportsOnboardingData) => {
    try {
      set({ isLoading: true, error: null });
      
      const sportsPreferences = await authService.completeSportsOnboarding(data);
      
      // Update user in state with new sports preferences
      const currentUser = get().user;
      if (currentUser) {
        set({ 
          user: {
            ...currentUser,
            sportsPreferences,
          },
          needsSportsOnboarding: false,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to complete sports onboarding',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update sports preferences
   */
  updateSportsPreferences: async (data: Partial<SportsOnboardingData>) => {
    try {
      set({ isLoading: true, error: null });
      
      const sportsPreferences = await authService.updateSportsPreferences(data);
      
      // Update user in state with new sports preferences
      const currentUser = get().user;
      if (currentUser) {
        set({ 
          user: {
            ...currentUser,
            sportsPreferences,
          },
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update sports preferences',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Clear current error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

// Helper hook to get auth state
export const useAuth = () => {
  const authState = useAuthStore();
  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isInitialized: authState.isInitialized,
    error: authState.error,
    needsSportsOnboarding: authState.needsSportsOnboarding,
    isAuthenticated: !!authState.user,
    signUp: authState.signUp,
    signIn: authState.signIn,
    signOut: authState.signOut,
    completeSportsOnboarding: authState.completeSportsOnboarding,
    updateSportsPreferences: authState.updateSportsPreferences,
    clearError: authState.clearError,
    initialize: authState.initialize,
  };
}; 