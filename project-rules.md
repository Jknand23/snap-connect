# Project Rules: AI-First Sports Snapchat Development Guidelines

## 🎯 **Project Philosophy**
This codebase follows **AI-First Development Principles**: modular, scalable, and easily comprehensible architecture designed for seamless integration with modern AI development tools and workflows.

**Core Values:**
- **Mobile-First Sports-Forward Minimalism**: Clean, efficient interfaces that prioritize sports content consumption
- **Functional and Declarative Programming**: Avoid classes, prefer iteration and modularization over duplication
- **Performance-Optimized**: Sub-3 second response times for RAG-generated content
- **Type-Safe**: Comprehensive TypeScript usage with strict mode enabled
- **AI-Compatible**: Files under 500 lines with comprehensive documentation for AI tool compatibility

---

## 📁 **Directory Structure**

### **Root Level Organization**
```
SnapConnect-V2/
├── src/                          # Main application source code
├── docs/                         # Project documentation
├── assets/                       # Static assets (images, fonts, etc.)
├── __tests__/                    # Global test files and utilities
├── scripts/                      # Build and deployment scripts
├── types/                        # Global TypeScript type definitions
└── config/                       # Configuration files
```

### **Source Code Structure (src/)**
```
src/
├── app/                          # Main application entry point
│   ├── index.tsx                 # App root component
│   ├── App.tsx                   # Main app wrapper
│   └── navigation/               # Navigation configuration
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (buttons, inputs, etc.)
│   ├── sports/                   # Sports-specific components
│   ├── camera/                   # Camera and AR components
│   ├── messaging/                # Chat and messaging components
│   └── common/                   # Common utility components
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication feature
│   ├── feed/                     # Main feed feature
│   ├── camera/                   # Camera functionality
│   ├── messaging/                # Messaging system
│   ├── communities/              # Fan communities
│   ├── sports-data/              # Sports data integration
│   └── ai-content/               # AI content generation
├── services/                     # External service integrations
│   ├── api/                      # API client configurations
│   ├── database/                 # Database utilities
│   ├── storage/                  # File storage utilities
│   ├── auth/                     # Authentication services
│   └── ai/                       # AI service integrations
├── stores/                       # State management (Zustand stores)
│   ├── auth.store.ts             # Authentication state
│   ├── feed.store.ts             # Feed state
│   ├── sports.store.ts           # Sports data state
│   └── user.store.ts             # User preferences state
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hooks
│   ├── useSportsData.ts          # Sports data hooks
│   ├── useCamera.ts              # Camera functionality hooks
│   └── useAI.ts                  # AI integration hooks
├── utils/                        # Utility functions
│   ├── validation/               # Input validation utilities
│   ├── formatting/               # Data formatting utilities
│   ├── constants/                # Application constants
│   └── helpers/                  # General helper functions
├── styles/                       # Styling and theme files
│   ├── theme.ts                  # Theme configuration
│   ├── colors.ts                 # Color definitions
│   ├── typography.ts             # Typography settings
│   └── animations.ts             # Animation configurations
└── types/                        # Feature-specific type definitions
    ├── auth.types.ts             # Authentication types
    ├── sports.types.ts           # Sports data types
    ├── api.types.ts              # API response types
    └── ui.types.ts               # UI component types
```

### **Feature Module Structure**
Each feature follows a consistent internal structure:
```
features/[feature-name]/
├── components/                   # Feature-specific components
├── hooks/                        # Feature-specific hooks
├── services/                     # Feature-specific services
├── stores/                       # Feature-specific state
├── types/                        # Feature-specific types
├── utils/                        # Feature-specific utilities
├── __tests__/                    # Feature tests
└── index.ts                      # Feature public API
```

---

## 📝 **File Naming Conventions**

### **General Naming Rules**
- **Components**: PascalCase (`UserProfile.tsx`, `SportsCard.tsx`)
- **Hooks**: camelCase with "use" prefix (`useAuth.ts`, `useSportsData.ts`)
- **Utilities**: camelCase (`formatDate.ts`, `validateInput.ts`)
- **Types**: PascalCase with `.types.ts` suffix (`User.types.ts`, `Sports.types.ts`)
- **Stores**: camelCase with `.store.ts` suffix (`auth.store.ts`, `user.store.ts`)
- **Services**: camelCase with `.service.ts` suffix (`api.service.ts`, `auth.service.ts`)
- **Constants**: SCREAMING_SNAKE_CASE in `constants.ts` files

### **Component Naming Patterns**
```typescript
// UI Components (generic, reusable)
Button.tsx
Modal.tsx
Input.tsx

// Feature Components (specific functionality)
LoginForm.tsx
SportsCard.tsx
TeamSelector.tsx

// Page/Screen Components
HomeScreen.tsx
ProfileScreen.tsx
CameraScreen.tsx

// Layout Components
AppLayout.tsx
ScreenLayout.tsx
CardLayout.tsx
```

### **File Extension Standards**
- **TypeScript React Components**: `.tsx`
- **TypeScript Utilities/Logic**: `.ts`
- **Type Definitions**: `.types.ts`
- **Store Files**: `.store.ts`
- **Service Files**: `.service.ts`
- **Hook Files**: `.ts` (with `use` prefix)
- **Test Files**: `.test.ts` or `.test.tsx`
- **Configuration Files**: `.config.ts`

---

## 🏗️ **Code Organization Principles**

### **File Size Limitations**
- **Maximum 500 lines per file** for AI tool compatibility
- **Recommended 200-300 lines** for optimal readability
- **Split large files** into smaller, focused modules
- **Use barrel exports** (`index.ts`) to maintain clean imports

### **File Structure Template**
Every file should follow this structure:
```typescript
/**
 * [File Name] - [Brief Description]
 * 
 * [Detailed explanation of the file's purpose, main functionality,
 * and how it fits into the larger application architecture]
 * 
 * @author [Author Name]
 * @created [Creation Date]
 * @modified [Last Modified Date]
 */

// External imports (libraries, frameworks)
import React from 'react';
import { View, Text } from 'react-native';

// Internal imports (utilities, types, components)
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import type { User } from '@/types';

// Types and interfaces specific to this file
interface ComponentNameProps {
  /** Description of prop */
  propName: string;
  /** Optional prop with default */
  optionalProp?: boolean;
}

// Constants used in this file
const COMPONENT_CONSTANTS = {
  DEFAULT_TIMEOUT: 5000,
  MAX_RETRIES: 3,
} as const;

// Main component/function implementation
// [Implementation code with proper JSDoc comments]

// Default export
export default ComponentName;

// Named exports
export { type ComponentNameProps };
```

### **Import Organization**
```typescript
// 1. External library imports
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';

// 2. Internal imports - utilities and types first
import { formatDate, validateInput } from '@/utils';
import type { User, ApiResponse } from '@/types';

// 3. Internal imports - components and hooks
import { Button, Card } from '@/components/ui';
import { useAuth, useSportsData } from '@/hooks';

// 4. Relative imports (same feature/directory)
import { LocalComponent } from './LocalComponent';
import { localUtility } from './utils';
```

---

## 📖 **Documentation Standards**

### **JSDoc Comment Requirements**
Every function, component, and complex type must have comprehensive JSDoc comments:

```typescript
/**
 * Fetches and formats sports data for a specific team
 * 
 * This function retrieves real-time sports data from our API,
 * applies user-specific formatting preferences, and returns
 * a standardized data structure for UI consumption.
 * 
 * @param teamId - Unique identifier for the sports team
 * @param options - Configuration options for data fetching
 * @param options.includeStats - Whether to include detailed statistics
 * @param options.format - Preferred data format ('compact' | 'detailed')
 * @returns Promise that resolves to formatted team data
 * 
 * @throws {ApiError} When API request fails
 * @throws {ValidationError} When teamId is invalid format
 * 
 * @example
 * ```typescript
 * const teamData = await fetchTeamData('team-123', {
 *   includeStats: true,
 *   format: 'detailed'
 * });
 * ```
 */
async function fetchTeamData(
  teamId: string,
  options: FetchOptions = {}
): Promise<TeamData> {
  // Implementation
}
```

### **Component Documentation**
```typescript
/**
 * SportsCard - Displays team information and live game data
 * 
 * A reusable card component that shows team information, current game status,
 * and allows users to interact with team-specific content. Supports both
 * light and dark themes with dynamic team color integration.
 * 
 * @component
 */
interface SportsCardProps {
  /** Team data object containing name, logo, and current game info */
  team: Team;
  /** Whether to show live game updates */
  showLiveUpdates?: boolean;
  /** Callback fired when user taps the card */
  onPress?: (team: Team) => void;
  /** Custom styling overrides */
  style?: ViewStyle;
}

const SportsCard: React.FC<SportsCardProps> = ({
  team,
  showLiveUpdates = true,
  onPress,
  style,
}) => {
  // Component implementation
};
```

---

## 🔧 **Code Quality Standards**

### **TypeScript Configuration**
- **Strict mode enabled** for all TypeScript files
- **Explicit return types** for all functions
- **Interface over type** for object definitions
- **Proper generic constraints** where applicable

### **Function Design Principles**
```typescript
// ✅ Good: Pure function with clear purpose
/**
 * Calculates the time remaining until game start
 */
function calculateTimeUntilGame(gameStartTime: Date): number {
  return gameStartTime.getTime() - Date.now();
}

// ✅ Good: Function with single responsibility
/**
 * Validates user input for team selection
 */
function validateTeamSelection(teamId: string): ValidationResult {
  // Implementation
}

// ❌ Avoid: Functions with multiple responsibilities
function handleUserActionAndUpdateUIAndSendAnalytics() {
  // Too many responsibilities
}
```

### **Component Design Patterns**
```typescript
// ✅ Preferred: Functional components with hooks
const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const { user, loading, error } = useUser(userId);
  
  // Component logic
  
  return (
    // JSX
  );
};

// ✅ Preferred: Custom hooks for complex logic
const useUserProfile = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hook logic
  
  return { user, loading, updateUser };
};
```

### **React Native Specific Conventions**
```typescript
// ✅ Performance optimizations
const SportsCard: React.FC<SportsCardProps> = React.memo(({ team, onPress }) => {
  // Use FlatList for large datasets
  const renderTeamItem = useCallback(({ item }: { item: Team }) => (
    <TeamItem team={item} onPress={onPress} />
  ), [onPress]);
  
  // Proper image handling
  return (
    <View className="bg-white rounded-xl p-4">
      <FastImage
        source={{ uri: team.logoUrl }}
        className="w-12 h-12 rounded-full"
        resizeMode="contain"
      />
      <Text className="text-lg font-semibold mt-2">{team.name}</Text>
    </View>
  );
});

// ✅ Proper navigation typing
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  TeamDetail: { teamId: string };
};

type TeamDetailScreenProps = StackScreenProps<RootStackParamList, 'TeamDetail'>;

const TeamDetailScreen: React.FC<TeamDetailScreenProps> = ({ route, navigation }) => {
  const { teamId } = route.params;
  // Screen implementation
};
```

### **Expo Integration Patterns**
```typescript
// ✅ Phase 1: Expo managed workflow
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  // Camera implementation
};

// ✅ Phase 2: Post-eject native modules
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const AdvancedCameraScreen: React.FC = () => {
  const devices = useCameraDevices();
  const device = devices.back;
  
  // Advanced camera implementation with native modules
};
```

---

## 🎨 **Styling and Theme Integration**

### **Styling Approach**
- **NativeWind (Tailwind CSS)** for consistent styling
- **Utility-first approach** with custom utilities for repeated patterns
- **Glassmorphic overlays** for AR and camera interfaces
- **Dynamic team color integration** with CSS variables
- **8pt grid system** for consistent spacing
- **Mobile-first responsive design** with thumb-zone optimization

### **Design System Standards**
```typescript
// Core Design Tokens
const DESIGN_TOKENS = {
  // Spacing (8pt grid)
  space: {
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    4: '1rem',     // 16px
    6: '1.5rem',   // 24px
  },
  
  // Border Radius
  radius: {
    sm: '0.125rem',
    base: '0.25rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  
  // Typography
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
} as const;
```

### **Glassmorphic Component Standards**
```typescript
// Glass effect utilities
const glassStyles = {
  light: 'bg-white/25 backdrop-blur-4 border border-white/30',
  dark: 'bg-slate-900/25 backdrop-blur-4 border border-white/10',
  strong: 'bg-white/40 backdrop-blur-6',
  ar: 'bg-black/30 backdrop-blur-2',
} as const;

// Usage in components
const CameraOverlay: React.FC = () => (
  <View className="absolute inset-0 flex items-end p-6">
    <View className="bg-black/30 backdrop-blur-2 rounded-xl p-4 max-w-xs">
      <Text className="text-white font-medium">2D Overlay Controls</Text>
    </View>
  </View>
);
```

### **Team Color Integration**
```typescript
// Dynamic team color system
interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

const applyTeamColors = (colors: TeamColors) => {
  // CSS variables for dynamic theming
  document.documentElement.style.setProperty('--team-primary', colors.primary);
  document.documentElement.style.setProperty('--team-secondary', colors.secondary);
  document.documentElement.style.setProperty('--team-accent', colors.accent);
};

// Component usage
const TeamCard: React.FC<{ team: Team }> = ({ team }) => {
  useEffect(() => {
    applyTeamColors(team.colors);
  }, [team.colors]);
  
  return (
    <View className="border-l-4 border-team-primary bg-white rounded-xl p-4">
      <Text className="text-team-primary font-bold text-lg">{team.name}</Text>
    </View>
  );
};
```

### **Mobile-First UI Patterns**
```typescript
// Thumb zone optimization classes
const thumbZoneClasses = {
  primary: 'absolute bottom-6 left-6 right-6',     // Primary actions
  secondary: 'absolute top-12 left-4 right-4',     // Secondary actions
  floating: 'absolute bottom-24 right-6',          // Floating action buttons
} as const;

// Sports-specific patterns
const sportsUIPatterns = {
  liveIndicator: 'bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold',
  scoreDisplay: 'text-4xl font-black tabular-nums',
  teamColors: 'border-l-4 border-team-primary',
  pulsingLive: 'animate-pulse-live',
} as const;
```

---

## 🧪 **Testing Standards**

### **Test File Organization**
```
src/
├── components/
│   ├── SportsCard.tsx
│   └── __tests__/
│       └── SportsCard.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
└── utils/
    ├── validation.ts
    └── __tests__/
        └── validation.test.ts
```

### **Test Documentation**
```typescript
/**
 * @fileoverview Tests for SportsCard component
 * 
 * Tests cover:
 * - Basic rendering with team data
 * - Live update functionality
 * - User interaction handling
 * - Theme integration
 */

describe('SportsCard', () => {
  /**
   * Test suite for basic rendering functionality
   */
  describe('rendering', () => {
    /**
     * Verifies that team name is displayed correctly
     */
    it('should display team name', () => {
      // Test implementation
    });
  });
});
```

---

## 🚀 **Performance Guidelines**

### **Bundle Optimization**
- **Code splitting** by feature and route
- **Lazy loading** for non-critical components
- **Tree shaking** friendly exports
- **Dynamic imports** for large dependencies

### **Memory Management**
```typescript
// ✅ Good: Proper cleanup in useEffect
useEffect(() => {
  const subscription = subscribeTo('sportsUpdates');
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// ✅ Good: Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexSportsStats(data);
}, [data]);
```

---

## 🔐 **Security Guidelines**

### **API Key Management**
- **Environment variables** for all sensitive data
- **No hardcoded secrets** in source code
- **Proper validation** of all user inputs
- **Type-safe API responses** with runtime validation

### **Data Validation**
```typescript
/**
 * Validates and sanitizes user input for team search
 */
function validateTeamSearchInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Team search input must be a string');
  }
  
  const sanitized = input.trim().slice(0, 100);
  
  if (sanitized.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }
  
  return sanitized;
}
```

---

## 📊 **State Management Rules**

### **Zustand Store Organization**
```typescript
/**
 * Authentication Store
 * 
 * Manages user authentication state, login/logout functionality,
 * and session persistence across app launches.
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  /** Authenticates user with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Signs out current user */
  logout: () => void;
  /** Clears authentication errors */
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Actions
  login: async (email, password) => {
    // Implementation
  },
  
  logout: () => {
    // Implementation
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
```

---

## 🤖 **AI Integration Standards**

### **RAG Implementation Patterns**
```typescript
/**
 * AI Content Service
 * 
 * Handles AI-powered content generation using RAG (Retrieval-Augmented Generation)
 * with OpenAI GPT-4 and vector similarity search via Supabase pgvector.
 */
interface RAGContentRequest {
  /** User query or content prompt */
  query: string;
  /** User context for personalization */
  userContext: UserContext;
  /** Content type to generate */
  contentType: 'news-summary' | 'highlight-caption' | 'community-response';
  /** Maximum response tokens */
  maxTokens?: number;
}

interface RAGContentResponse {
  /** Generated content */
  content: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Source documents used */
  sources: ContentSource[];
  /** Generation metadata */
  metadata: GenerationMetadata;
}

// Service implementation
export class AIContentService {
  /**
   * Generates personalized sports content using RAG pipeline
   * 
   * @param request - Content generation request
   * @returns Promise resolving to generated content with metadata
   */
  async generateContent(request: RAGContentRequest): Promise<RAGContentResponse> {
    try {
      // 1. Vector similarity search for relevant context
      const relevantContext = await this.searchRelevantContent(request.query, request.userContext);
      
      // 2. Construct prompt with context
      const prompt = this.buildPrompt(request, relevantContext);
      
      // 3. Generate content via OpenAI
      const response = await this.openaiClient.createCompletion({
        model: 'gpt-4',
        prompt,
        max_tokens: request.maxTokens ?? 150,
        temperature: 0.7,
      });
      
      // 4. Process and return structured response
      return this.processResponse(response, relevantContext);
    } catch (error) {
      throw new AIContentError(`Content generation failed: ${error.message}`);
    }
  }
  
  /**
   * Searches for relevant content using vector similarity
   */
  private async searchRelevantContent(
    query: string, 
    userContext: UserContext
  ): Promise<ContentSource[]> {
    // Vector search implementation
    const embedding = await this.generateEmbedding(query);
    
    const { data } = await this.supabase
      .from('content_embeddings')
      .select('content, metadata, similarity')
      .filter('user_teams', 'cs', userContext.favoriteTeams)
      .rpc('match_content', { 
        query_embedding: embedding, 
        match_threshold: 0.8, 
        match_count: 5 
      });
    
    return data || [];
  }
}
```

### **Real-Time Sports Data Integration**
```typescript
/**
 * Sports Data Service
 * 
 * Manages real-time sports data from NewsAPI, BallDontLie, and API-Sports
 * with intelligent caching and personalization.
 */
export class SportsDataService {
  /**
   * Subscribes to real-time game updates for user's favorite teams
   */
  subscribeToGameUpdates(teams: string[], callback: (update: GameUpdate) => void) {
    teams.forEach(teamId => {
      this.supabase
        .channel(`game-updates-${teamId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_updates',
          filter: `team_id=eq.${teamId}`,
        }, callback)
        .subscribe();
    });
  }
  
  /**
   * Fetches personalized sports highlights
   */
  async getPersonalizedHighlights(userId: string): Promise<SportsHighlight[]> {
    const userPreferences = await this.getUserPreferences(userId);
    
    // Combine multiple data sources
    const [newsApiContent, ballDontLieData, apiSportsData] = await Promise.all([
      this.fetchNewsAPIContent(userPreferences.teams),
      this.fetchBallDontLieData(userPreferences.teams),
      this.fetchApiSportsData(userPreferences.teams),
    ]);
    
    // Apply AI-powered ranking
    return this.rankHighlightsByRelevance(
      [...newsApiContent, ...ballDontLieData, ...apiSportsData],
      userPreferences
    );
  }
}
```

### **AI-Powered 2D Overlay Generation**
```typescript
/**
 * 2D Overlay Service
 * 
 * Generates personalized 2D overlays based on user's team preferences
 * and current sports context.
 */
export class OverlayService {
  /**
   * Generates team-specific 2D overlays
   */
  async generateTeamOverlays(teamId: string): Promise<TeamOverlay[]> {
    const team = await this.getTeamData(teamId);
    
    return [
      {
        id: `${teamId}-logo-overlay`,
        name: `${team.name} Logo Overlay`,
        type: 'logo-overlay',
        config: {
          logoUrl: team.logoUrl,
          colors: team.colors,
          position: 'top-right',
        },
      },
      {
        id: `${teamId}-victory-celebration`,
        name: `${team.name} Victory`,
        type: 'particle-effect',
        config: {
          particles: 'confetti',
          colors: team.colors,
          trigger: 'team-score',
        },
      },
    ];
  }
  
  /**
   * AI-generated contextual overlays based on current game state
   */
  async generateContextualOverlays(gameContext: GameContext): Promise<TeamOverlay[]> {
    const prompt = `Generate 2D overlay suggestions for ${gameContext.situation}`;
    
    const suggestions = await this.aiContentService.generateContent({
      query: prompt,
      userContext: gameContext.userContext,
      contentType: '2d-overlay-suggestions',
    });
    
    return this.convertSuggestionsToOverlays(suggestions);
  }
}
```

---

## 🔄 **Git and Version Control**

### **Branch Naming Convention**
- **Feature branches**: `feature/user-authentication`
- **Bug fixes**: `fix/camera-permission-issue`
- **Hotfixes**: `hotfix/critical-login-bug`
- **Refactoring**: `refactor/sports-data-service`

### **Commit Message Format**
```
type(scope): brief description

Detailed explanation of the change, including:
- What was changed and why
- Any breaking changes
- Related issue numbers

Examples:
feat(auth): add social login integration
fix(camera): resolve iOS permission handling
docs(readme): update installation instructions
refactor(sports): extract team data utilities
```

---

## ✅ **Development Checklist**

Before committing any code, ensure:

### **Code Quality**
- [ ] File is under 500 lines
- [ ] All functions have JSDoc comments
- [ ] TypeScript strict mode compliance
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented

### **Testing**
- [ ] Unit tests written for new functionality
- [ ] All tests pass locally
- [ ] Test coverage meets minimum requirements
- [ ] Edge cases considered and tested

### **Documentation**
- [ ] File header comment present
- [ ] Complex logic explained in comments
- [ ] Public API documented
- [ ] Breaking changes noted

### **Performance**
- [ ] No memory leaks introduced
- [ ] Proper cleanup in useEffect hooks
- [ ] Expensive operations memoized
- [ ] Bundle size impact considered

### **Security**
- [ ] User input validated and sanitized
- [ ] No sensitive data exposed
- [ ] Proper authentication checks
- [ ] API endpoints secured

---

---

## 🏈 **Sports-Specific Development Patterns**

### **Sports Data Modeling**
```typescript
// Core sports entities with consistent structure
interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  league: 'NFL' | 'NBA' | 'MLB';
  conference?: string;
  division?: string;
}

interface Player {
  id: string;
  name: string;
  team: Team;
  position: string;
  jerseyNumber: number;
  stats: Record<string, number>;
  photoUrl?: string;
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: Date;
  status: 'scheduled' | 'live' | 'completed';
  score?: {
    home: number;
    away: number;
  };
  currentPeriod?: string;
  timeRemaining?: string;
}
```

### **User Flow Integration Patterns**
```typescript
// User journey tracking for AI personalization
interface UserJourneyEvent {
  eventType: 'content_view' | 'team_follow' | 'game_watch' | 'overlay_use';
  timestamp: Date;
  userId: string;
  metadata: {
    teamId?: string;
    gameId?: string;
    contentType?: string;
    duration?: number;
    engagement?: 'high' | 'medium' | 'low';
  };
}

// Personalization data collection
class PersonalizationService {
  /**
   * Tracks user interactions for AI learning
   */
  async trackUserInteraction(event: UserJourneyEvent): Promise<void> {
    // Store for RAG context building
    await this.supabase
      .from('user_interactions')
      .insert(event);
    
    // Update user preference scores
    await this.updatePreferenceScores(event);
  }
  
  /**
   * Generates personalized content feed
   */
  async generatePersonalizedFeed(userId: string): Promise<FeedItem[]> {
    const userPreferences = await this.getUserPreferences(userId);
    const contextualData = await this.getContextualSportsData();
    
    // AI-powered content ranking
    return this.rankContentByRelevance(contextualData, userPreferences);
  }
}
```

### **Community Features Implementation**
```typescript
// Fan community management
interface CommunityPost {
  id: string;
  authorId: string;
  teamId: string;
  content: string;
  mediaUrl?: string;
  reactions: Record<string, number>;
  createdAt: Date;
  gameContext?: {
    gameId: string;
    gameMinute: number;
    situation: string;
  };
}

// Real-time community features
class CommunityService {
  /**
   * Creates game-specific discussion threads
   */
  async createGameThread(gameId: string): Promise<CommunityThread> {
    const game = await this.getGameData(gameId);
    
    return {
      id: `game-${gameId}`,
      title: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
      type: 'game_discussion',
      participants: [],
      messages: [],
      isLive: game.status === 'live',
    };
  }
  
  /**
   * Manages live game reactions
   */
  subscribeToGameReactions(gameId: string, callback: (reaction: GameReaction) => void) {
    this.supabase
      .channel(`game-reactions-${gameId}`)
      .on('broadcast', { event: 'reaction' }, callback)
      .subscribe();
  }
}
```

---

## 📚 **Project-Specific Best Practices**

### **Sports Content Prioritization**
- **Live content first**: Prioritize real-time game updates and live community discussions
- **Personalization hierarchy**: User's teams > Followed players > League news > General content
- **Time-sensitive handling**: Breaking news and game alerts take precedence over cached content
- **Context awareness**: Surface relevant content based on current sports calendar and user timezone

### **Mobile Sports Fan UX**
- **One-handed operation**: Design for users watching games while using the app
- **Glanceable information**: Key stats and scores visible without scrolling
- **Quick sharing**: Minimal taps to share highlights or reactions
- **Notification intelligence**: Smart alerts that don't overwhelm during live games

### **AI Content Quality Standards**
- **Sports accuracy**: Verify AI-generated sports facts against authoritative sources
- **Personalization validation**: Test AI recommendations against user behavior patterns
- **Content freshness**: Prioritize recent sports events in RAG context
- **Bias mitigation**: Ensure fair representation across different teams and players

---

## 🎯 **AI-First Development Benefits**

This structure ensures:
- **Easy navigation** for AI tools and developers
- **Clear context** through comprehensive documentation
- **Modular architecture** that scales with team growth
- **Consistent patterns** that reduce cognitive load
- **Type safety** that catches errors early
- **Performance optimization** built into the development process
- **Sports domain expertise** embedded in code structure
- **Real-time data handling** optimized for live sports content
- **Personalization-ready** architecture for AI-driven user experiences

Following these rules creates a codebase that is not only maintainable by humans but also easily understood and modified by AI development tools, enabling faster development cycles and better code quality. 