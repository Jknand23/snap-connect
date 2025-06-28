# Phase 2 Setup Guide: MVP Sports Snapchat

This guide will help you set up your Supabase project and deploy Phase 2 of SnapConnect V2.

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Choose a region close to your users
5. Set a strong database password

### 2. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `database/schema.sql`
4. Run the script to create all tables, functions, and policies

### 3. Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   **Where to find these:**
   - Go to Project Settings → API
   - Copy the URL and anon/public key

### 4. Install Dependencies & Start Development

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android
```

## 📱 Core Phase 2 Features

### ✅ Implemented Features

1. **Sports Onboarding**
   - Team and league selection
   - User preferences setup
   - Sports profile creation

2. **Camera System**
   - Photo/video capture
   - Basic 2D sports-themed overlays
   - Sports-themed overlays

3. **Stories System**
   - 24-hour story expiration
   - Privacy controls (public, friends, teams)
   - View tracking and analytics

4. **Real-time Messaging**
   - Direct messages
   - Group chats
   - Team-based discussions
   - Message reactions

5. **Database Architecture**
   - Complete schema with RLS policies
   - User profiles and sports preferences
   - Friend system with status tracking
   - Content feed and discovery

### 🔧 Configuration Steps

#### Enable Real-time Features
1. In Supabase dashboard, go to **Database → Replication**
2. Enable replication for these tables:
   - `messages`
   - `stories`
   - `chat_participants`

#### Set Up Storage Buckets
1. Go to **Storage** in Supabase dashboard
2. Create these buckets:
   - `stories` (for story media)
   - `avatars` (for profile pictures)
   - `messages` (for message media)

3. Set up bucket policies:
   ```sql
   -- Allow authenticated users to upload to stories bucket
   CREATE POLICY "Authenticated users can upload stories" ON storage.objects
     FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');
   
   -- Allow users to view public stories
   CREATE POLICY "Stories are publicly viewable" ON storage.objects
     FOR SELECT USING (bucket_id = 'stories');
   ```

## 🏗️ Architecture Overview

### Frontend Structure
```
src/
├── features/
│   ├── onboarding/           # Sports preference setup
│   ├── camera/              # Photo/video capture
│   ├── stories/             # Story viewing/creation
│   ├── messaging/           # Real-time chat
│   └── home/               # Main feed
├── services/
│   ├── auth/               # Supabase authentication
│   ├── messaging/          # Chat functionality
│   └── stories/            # Story management
├── stores/                 # Zustand state management
├── types/                  # TypeScript definitions
└── components/             # Reusable UI components
```

### Database Schema
- **profiles**: User information and sports preferences
- **teams**: Reference data for sports teams
- **stories**: Time-limited content with privacy controls
- **messages**: Real-time chat with reactions
- **friendships**: Social connections between users
- **posts**: Content feed for discovery

## 🔐 Security & Privacy

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Friends can view each other's content based on privacy settings
- Public content is accessible to all authenticated users

### Privacy Controls
- **Stories**: Public, Friends, or Team-specific visibility
- **Messages**: Only chat participants can access
- **Profile**: Public profiles with private preferences

## 📊 Testing Your Setup

### 1. Test User Registration
```typescript
// In your app
const { data } = await authService.signUp(
  'test@example.com',
  'password123',
  {
    username: 'sportsfan1',
    full_name: 'Sports Fan'
  }
);
```

### 2. Test Sports Onboarding
1. Register a new user
2. Navigate through sports selection
3. Verify preferences are saved in database

### 3. Test Camera & Stories
1. Grant camera permissions
2. Capture a photo/video
3. Add sports filter
4. Create story with privacy setting

### 4. Test Messaging
1. Create two user accounts
2. Send friend request
3. Start direct message
4. Test real-time message delivery

## 🚀 Deployment

### Expo Development Build
```bash
# Create development build
npx expo install --fix
npx expo prebuild
npx expo run:android
```

### Production Build
```bash
# Build for production
eas build --platform android
```

## 🔧 Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure camera permissions are granted
   - Check if running on physical device (not simulator)

2. **Stories not loading**
   - Verify RLS policies are correctly set up
   - Check if user has friends for content

3. **Real-time not working**
   - Enable replication in Supabase
   - Check network connectivity

4. **TypeScript errors**
   - Run `npm install` to ensure all dependencies
   - Restart TypeScript server in your IDE

5. **NativeWind v4 Styling Issues**
   - **Problem**: CSS plugin async errors (`Use process(css).then(cb) to work with async plugins`)
   - **Solution**: Upgrade to NativeWind v4 with proper configuration:
     ```bash
     npm install nativewind@^4.0.1 tailwindcss@^3.4.0 --legacy-peer-deps
     npx expo start --clear
     ```
   - **Required Files**: Ensure `global.css`, proper `metro.config.js`, and `babel.config.js` are configured
   - **Status**: ✅ **Resolved** - NativeWind v4 now properly configured with Metro and Babel integration

### Environment Issues

1. **Supabase connection fails**
   ```bash
   # Verify your .env file
   cat .env
   
   # Ensure URL and key are correct
   ```

2. **Build failures**
   ```bash
   # Clean and reinstall
   rm -rf node_modules
   npm install
   
   # Clear Expo cache
   npx expo start --clear
   ```

3. **Styling not rendering**
   - Verify NativeWind v4 is properly installed
   - Check that `global.css` exists and is linked
   - Ensure `nativewind-env.d.ts` is present for TypeScript support

## 📈 Next Steps (Phase 3)

Once Phase 2 is working:

1. **AI Integration**: OpenAI for content personalization
2. **Live Sports Data**: ESPN/SportsData.io APIs
3. **Advanced AR**: Team logos and celebrations
4. **Push Notifications**: Game alerts and messages
5. **Content Discovery**: AI-powered feed algorithms

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure Supabase project is properly configured
4. Test with simple operations first (auth, basic queries)

The Phase 2 implementation provides a solid foundation for a sports-focused social media app with core Snapchat-style functionality! 