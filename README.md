# SnapConnect V2: AI-Powered Sports Snapchat

> **Personalized social media platform for sports fans with real-time content, AR experiences, and AI-driven personalization.**

## 🏈 Project Overview

SnapConnect V2 is an innovative AI-first social media platform designed specifically for sports fans. It consolidates sports content consumption and fan engagement into a single, personalized experience powered by cutting-edge AI technology.

### Problem We're Solving
- **Fragmented Experience**: Sports fans must navigate multiple platforms for news, highlights, and fan discussions
- **Generic Content**: Existing platforms lack personalization for specific teams and player interests  
- **Limited Community**: Difficulty connecting with like-minded fans and building meaningful sports communities

### Our Solution
- **Unified Platform**: Single app for all sports content consumption and creation
- **AI-Powered Personalization**: RAG-enhanced content suggestions tailored to favorite teams and players
- **Enhanced AR Experiences**: Team-specific filters and camera effects
- **Dedicated Fan Communities**: Connect with other supporters based on shared sports interests

## 🎯 Core Features

### MVP (Phase 1) ✅ COMPLETED
- ✅ Real-time photo/video sharing with disappearing messages
- ✅ Basic AR filters and camera effects  
- ✅ User authentication and friend management
- ✅ Stories and group messaging functionality
- ✅ Complete 4-tab navigation (Feed, Messages, Camera, Discovery)
- ✅ Core UI component library with sports theming
- ✅ Database integration with Supabase

### Enhanced Features (Phase 2+)
- 🚀 Consolidated sports news feeds
- 🚀 Real-time game highlights and updates
- 🚀 Interactive fan communities
- 🚀 Advanced AI-powered content personalization
- 🚀 Team-specific AR filters and experiences

### Supported Sports
- **NFL** (National Football League)
- **NBA** (National Basketball Association)
- **MLB** (Major League Baseball)

## 📖 User Stories

Our platform addresses unique challenges that sports fans face, going beyond basic social media functionality:

### **1. AI-Powered Content Personalization**
*As a sports fan, I want to receive personalized news and highlights about my favorite teams and players, so that I don't miss important updates and can stay informed without browsing multiple sources.*

### **2. Sports-Specific Social Graph**
*As a sports fan, I want to connect and engage with other fans of my favorite teams in dedicated communities, so that I can share my passion, discuss games, and feel part of a larger fan base.*

### **3. AI-Generated Content Summaries**
*As a busy sports enthusiast, I want to get quick, AI-generated summaries of games I missed, so that I can catch up on the action without watching full replays.*

### **4. Team-Specific AR Personalization**
*As a creative sports fan, I want to use team-specific AR filters and effects when creating content, so that I can show my team pride and create engaging posts that reflect my fandom.*

### **5. Multi-Platform Sports Consolidation**
*As a multi-team fan, I want to track live games and get real-time highlights from multiple matches simultaneously, so that I can follow all the action without switching between different apps.*

### **6. Personalized Daily Sports Digest**
*As a sports fan with limited time, I want a personalized daily digest of the most important sports news and highlights relevant to my interests, so that I can stay informed efficiently.*

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native (Expo → Bare React Native)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **Real-time**: Supabase Realtime

### Backend
- **Platform**: Supabase (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL with pgvector extension
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage with CDN
- **Serverless**: Supabase Edge Functions

### AI & Data
- **LLM**: OpenAI GPT-4 API
- **Vector Search**: pgvector (PostgreSQL extension)
- **RAG Pipeline**: Custom implementation via Edge Functions
- **Sports APIs**: ESPN API, SportsData.io

### Development
- **Language**: TypeScript (strict mode)
- **Testing**: Jest + React Native Testing Library
- **Platform**: Windows development targeting Android
- **Deployment**: Vercel for web components

## 🏗️ Architecture Principles

### AI-First Development
- **Modular Architecture**: Easy to understand and navigate for AI tools
- **Comprehensive Documentation**: JSDoc comments on all functions
- **File Size Limits**: Maximum 500 lines per file for AI compatibility
- **Type Safety**: Strict TypeScript configuration throughout

### Code Organization
```
src/
├── app/                    # Application entry point
├── components/            # Reusable UI components
├── features/             # Feature-based modules
├── services/             # External service integrations
├── stores/               # State management (Zustand)
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── styles/               # Theme and styling
└── types/                # TypeScript definitions
```

### Development Standards
- **Functional Programming**: Avoid classes, prefer pure functions
- **Component Design**: Functional components with hooks
- **Performance**: Sub-3 second response times for AI-generated content
- **Mobile-First**: Optimized for one-handed operation and sports consumption

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Android Studio** with Android SDK
- **Java Development Kit** (JDK 11+)
- **Expo CLI**
- **Supabase CLI**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/snapconnect-v2.git
   cd snapconnect-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your API keys and configuration
   ```

4. **Start the development server**
   ```bash
   npm run start
   # or
   yarn start
   ```

5. **Run on Android**
   ```bash
   npm run android
   # or
   yarn android
   ```

### Environment Variables
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Sports Data APIs
ESPN_API_KEY=your_espn_api_key
SPORTSDATA_API_KEY=your_sportsdata_api_key
```

## 📁 File Naming Conventions

### Components
- **UI Components**: `Button.tsx`, `Modal.tsx`, `Input.tsx`
- **Feature Components**: `LoginForm.tsx`, `SportsCard.tsx`, `TeamSelector.tsx`
- **Screen Components**: `HomeScreen.tsx`, `ProfileScreen.tsx`

### Utilities & Services
- **Hooks**: `useAuth.ts`, `useSportsData.ts` (camelCase with "use" prefix)
- **Services**: `api.service.ts`, `auth.service.ts` (camelCase with `.service.ts`)
- **Stores**: `auth.store.ts`, `user.store.ts` (camelCase with `.store.ts`)
- **Types**: `User.types.ts`, `Sports.types.ts` (PascalCase with `.types.ts`)

## 📚 Documentation Standards

Every file must include:
- **File header** with purpose and description
- **JSDoc comments** for all functions and components
- **Type definitions** with proper interfaces
- **Usage examples** for complex utilities

Example:
```typescript
/**
 * SportsCard - Displays team information and live game data
 * 
 * A reusable card component that shows team information, current game status,
 * and allows users to interact with team-specific content.
 * 
 * @component
 */
interface SportsCardProps {
  /** Team data object containing name, logo, and game info */
  team: Team;
  /** Whether to show live game updates */
  showLiveUpdates?: boolean;
  /** Callback fired when user taps the card */
  onPress?: (team: Team) => void;
}
```

## 🎨 Design System

### Styling Approach
- **NativeWind**: Utility-first CSS framework
- **Glassmorphic UI**: Modern glass effects for AR interfaces
- **Team Colors**: Dynamic theming based on user's favorite teams
- **8pt Grid System**: Consistent spacing throughout the app
- **Mobile-First**: Optimized for thumb-zone interaction

### Key UI Patterns
```typescript
// Glassmorphic overlays
const glassStyles = {
  light: 'bg-white/25 backdrop-blur-4 border border-white/30',
  dark: 'bg-slate-900/25 backdrop-blur-4 border border-white/10',
  ar: 'bg-black/30 backdrop-blur-2',
};

// Sports-specific patterns
const sportsUIPatterns = {
  liveIndicator: 'bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold',
  teamColors: 'border-l-4 border-team-primary',
  scoreDisplay: 'text-4xl font-black tabular-nums',
};
```

## 🧪 Testing

### Test Organization
- **Unit Tests**: Components, hooks, and utilities
- **Integration Tests**: Feature workflows and API integrations
- **E2E Tests**: Critical user journeys

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 🔧 Troubleshooting

### Common Setup Issues

**Problem**: NativeWind CSS plugin errors during build
```
ERROR index.ts: Use process(css).then(cb) to work with async plugins
```

**Solution**: The project now uses NativeWind v4 with proper configuration. If you encounter this error:

1. **Ensure correct versions are installed**:
   ```bash
   npm install nativewind@^4.0.1 tailwindcss@^3.4.0 --legacy-peer-deps
   ```

2. **Verify configuration files**:
   - `tailwind.config.js` includes `presets: [require("nativewind/preset")]`
   - `metro.config.js` uses `withNativeWind(config, { input: './global.css' })`
   - `babel.config.js` uses presets format (not plugins)
   - `global.css` exists with Tailwind directives

3. **Clear cache and restart**:
   ```bash
   npx expo start --clear
   ```

**Problem**: Styling not appearing in app

**Solution**: 
- Verify `nativewind-env.d.ts` exists for TypeScript support
- Check that all component file paths are included in `tailwind.config.js` content array
- Ensure Metro cache is cleared

**Problem**: Build succeeds but black screen on Android

**Solution**: Usually indicates a configuration error. Check Metro bundler logs and ensure all environment variables are properly set.

### Environment Issues

**Problem**: Missing `.env` file
- Copy `env.example` to `.env` and add your actual API keys
- Restart development server after adding environment variables

**Problem**: Supabase connection issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure RLS policies allow authenticated access

## 🤖 AI Integration

### RAG Pipeline
- **Vector Search**: pgvector for similarity search
- **Context Building**: User preferences + sports knowledge
- **Content Generation**: OpenAI GPT-4 with sports-specific prompts
- **Personalization**: Continuous learning from user interactions

### AI Features
- **Personalized News**: Custom sports news summaries
- **Smart Highlights**: AI-curated game highlights
- **AR Filter Suggestions**: Context-aware filter recommendations
- **Community Insights**: AI-powered fan discussion summaries

## 📈 Performance Goals

- **RAG Response Time**: Sub-3 seconds for AI-generated content
- **Real-time Updates**: Sub-second latency for live sports data
- **App Launch**: Under 2 seconds on mid-range Android devices
- **Memory Usage**: Efficient handling of media-heavy content

## 🔐 Security & Privacy

- **Row Level Security**: Database-level access control
- **Input Validation**: All user inputs sanitized and validated
- **API Security**: Proper authentication and rate limiting
- **Data Privacy**: User data handling compliant with privacy regulations

## 🚢 Deployment

### Development Phases
1. **Phase 1**: Expo managed workflow for rapid MVP development
2. **Phase 2**: Eject to bare React Native for advanced native features
3. **Phase 3**: Production deployment with advanced AR capabilities

### Environments
- **Development**: Local development with Expo Go
- **Staging**: Supabase staging environment
- **Production**: Full deployment with monitoring and analytics

## 📖 Additional Documentation

- **[Project Overview](./project-overview.md)**: Detailed project goals and scope
- **[User Flow](./user-flow.md)**: Complete user journey documentation
- **[Tech Stack](./tech-stack.md)**: Comprehensive technology decisions
- **[Project Rules](./project-rules.md)**: Development guidelines and conventions
- **[UI Rules](./ui-rules.md)**: Design system and UI guidelines
- **[Theme Rules](./theme-rules.md)**: Theming and styling standards

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow our coding standards** (see project-rules.md)
4. **Write tests** for new functionality
5. **Commit with conventional commits**: `feat(auth): add social login`
6. **Submit a pull request**

### Development Checklist
- [ ] File is under 500 lines
- [ ] All functions have JSDoc comments
- [ ] TypeScript strict mode compliance
- [ ] Tests written and passing
- [ ] Performance impact considered

## 📞 Support

For questions, issues, or contributions:
- **Issues**: [GitHub Issues](https://github.com/your-org/snapconnect-v2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/snapconnect-v2/discussions)
- **Documentation**: Check the `_docs/` directory for detailed guides

---

**Built with ❤️ for sports fans by sports fans** 