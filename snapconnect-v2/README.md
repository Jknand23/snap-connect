# SnapConnect V2 🏈📱

AI-powered personalized Snapchat for sports fans with real-time messaging, AR filters, and RAG-powered content personalization.

## 🚀 Phase 1 Setup - Complete

This project has been initialized with the foundation framework for Phase 1. The following components are now set up:

### ✅ Project Structure
```
src/
├── app/
│   ├── navigation/
│   │   └── MainNavigator.tsx
│   └── index.tsx
├── components/
│   ├── ui/
│   │   └── Button.tsx
│   └── common/
├── features/
│   ├── auth/
│   ├── home/
│   │   └── HomeScreen.tsx
│   ├── camera/
│   │   └── CameraScreen.tsx
│   └── profile/
│       └── ProfileScreen.tsx
├── services/
│   ├── auth/
│   │   └── supabaseAuth.ts
│   ├── api/
│   └── database/
├── stores/
│   └── authStore.ts
└── types/
    └── navigation.ts
```

### ✅ Tech Stack Installed
- **Expo React Native** with TypeScript
- **NativeWind v4** for styling with sports-themed colors
- **React Navigation v6** with bottom tabs
- **Zustand** for state management
- **Supabase** client for authentication and database
- **React Native Reanimated** for animations

### ✅ Core Features
- ✅ Basic navigation between Home, Camera, and Profile screens
- ✅ TypeScript configuration with proper JSX support
- ✅ Authentication store with Zustand
- ✅ Supabase authentication service setup
- ✅ Reusable UI component library started
- ✅ Sports-themed color palette configured
- ✅ NativeWind v4 styling system properly configured

## 🛠 Development Setup

### Prerequisites
- Node.js 18+
- Android Studio with Android SDK (for Android development)
- Expo CLI installed globally

### Getting Started

1. **Environment Variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Add your actual API keys:
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Run the Development Server**
   ```bash
   # For web development
   npm run web
   
   # For Android (requires Android emulator or device)
   npm run android
   
   # For iOS (macOS only)
   npm run ios
   ```

3. **Test the App**
   - Navigate between Home, Camera, and Profile screens
   - Verify TypeScript compilation works
   - Check that the sports-themed dark UI displays correctly

## 📋 Phase 1 Deliverables Status

### 1. ✅ Project Initialization & Environment Setup
- [x] Expo React Native project with TypeScript
- [x] NativeWind styling configuration
- [x] AI-first directory structure
- [x] Core dependencies installed
- [x] Development scripts configured

### 2. ✅ Basic Navigation Framework
- [x] React Navigation v6 setup
- [x] Bottom tab navigation with sports theme
- [x] Placeholder screens (Home, Camera, Profile)
- [x] TypeScript navigation types
- [x] Basic dark UI layout

### 3. ✅ Authentication Infrastructure - **WORKING**
- [x] Supabase client configuration
- [x] ✅ **Authentication service with working login/signup methods**
- [x] ✅ **Zustand authentication state management**
- [x] ✅ **Complete database schema with all required tables**
- [x] ✅ **Email confirmation configured and operational**
- [x] Basic authentication types

### 4. ✅ Core UI Component Library
- [x] Base Button component with variants
- [x] Sports-themed color palette
- [x] TypeScript component props
- [x] Consistent styling approach

### 5. ✅ Database Schema Foundation - **COMPLETE**
- [x] ✅ **User profiles table implemented and working**
- [x] ✅ **Sports reference tables (NFL, NBA, MLB) with sample data**
- [x] ✅ **RLS policies setup and configured**
- [x] ✅ **Database triggers for automatic profile creation**

## 🎯 Next Steps (Phase 2)

1. ✅ **~~Complete Database Schema~~** - **DONE**
   - ✅ ~~Set up Supabase database tables~~
   - ✅ ~~Implement Row Level Security policies~~
   - ✅ ~~Add sports reference data~~

2. ✅ **~~Authentication Screens~~** - **DONE**
   - ✅ ~~Create login/signup forms~~
   - ✅ ~~Add form validation~~
   - ✅ ~~Implement authentication flow~~

3. **Enhanced UI Components**
   - Add Input, Card, Modal components
   - Implement glassmorphic overlays
   - Add theme switching

4. **Camera Integration**
   - Integrate Expo Camera API
   - Add basic capture functionality
   - Implement media storage

## 🏗 Architecture

- **AI-First Design**: Modular, scalable structure optimized for AI tool navigation
- **Feature-Based**: Organized by features rather than file types
- **TypeScript**: Strict typing throughout for better development experience
- **Functional Components**: Modern React patterns with hooks

## 🔧 Tech Stack

- **Frontend**: React Native (Expo) + TypeScript
- **Styling**: NativeWind v4 (Tailwind for React Native)
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Real-time**: Supabase Realtime

## 🚨 Troubleshooting

### Common Issues

**Problem**: CSS plugin async errors during build
```
ERROR index.ts: Use process(css).then(cb) to work with async plugins
```

**Solution**: This has been resolved with NativeWind v4 configuration. If you encounter this:
1. Ensure you have the latest version with `npm install`
2. Clear Metro cache: `npx expo start --clear`
3. Check that all configuration files (metro.config.js, babel.config.js, tailwind.config.js) are properly set up

**Problem**: Black screen on Android emulator

**Solution**: 
1. Verify your `.env` file exists with valid Supabase credentials
2. Check Metro bundler logs for specific errors
3. Ensure Android emulator has proper network connectivity

**Problem**: Styling not appearing

**Solution**: 
1. Verify NativeWind v4 is properly installed
2. Check that `global.css` exists and is properly linked
3. Ensure `nativewind-env.d.ts` is present for TypeScript support

### Environment Setup Issues

**Problem**: Missing environment variables
- Copy `env.example` to `.env` and add your Supabase URL and anon key
- Restart the development server after making changes

**Problem**: Supabase connection fails
- Verify your Supabase project is active
- Check that your URL and anon key are correct
- Ensure RLS policies allow authenticated access

## 📱 Platform Support

- **Primary**: Android (Windows development environment)
- **Secondary**: Web (for rapid development)
- **Future**: iOS (when ready for App Store deployment)

---

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 Development 🚀 