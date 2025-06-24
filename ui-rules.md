# UI Design Rules: AI-Powered Sports Snapchat

## 🎯 **Core Design Philosophy**
**Mobile-First Sports-Forward Minimalism**: Clean, efficient interfaces that prioritize sports content consumption while maintaining the energy and community feeling essential for sports fans.

---

## 📱 **Mobile-First Principles**

### **Thumb Zone Optimization**
- **Primary actions within 75% screen height**: Place critical buttons (camera, send, react) in easy thumb reach
- **Secondary actions in upper regions**: Settings, profile, search can be placed in harder-to-reach areas
- **Swipe gestures over taps**: Prioritize horizontal swipes for navigation, vertical swipes for content browsing
- **Minimum touch target**: 44pt minimum for all interactive elements

### **Screen Real Estate Management**
- **Content-first hierarchy**: Sports imagery and video take priority over UI elements
- **Collapsible navigation**: Hide nav bars during content consumption (auto-hide during video playback)
- **Contextual toolbars**: Show relevant actions only when needed (camera controls when camera is active)
- **Progressive disclosure**: Reveal advanced features through progressive taps/swipes

### **Performance-Optimized Interactions**
- **Immediate feedback**: All touch interactions provide instant visual feedback (<16ms)
- **Skeleton screens**: Show content structure immediately while loading
- **Optimistic updates**: Show user actions immediately, sync in background
- **Gesture interruption**: Allow users to interrupt loading states with new gestures

---

## 🏈 **Sports-Specific UI Patterns**

### **Live Content Prioritization**
- **Live indicators**: Red dot + "LIVE" badge for active games and breaking news
- **Pulsing animations**: Subtle pulse for live content cards (2s interval)
- **Score prominence**: Large, bold typography for scores and game times
- **Team color integration**: Subtle team color accents (borders, backgrounds, icons)

### **Real-Time Feed Design**
- **Pull-to-refresh**: Sports fans expect frequent updates - make refresh obvious and satisfying
- **Auto-scroll pause**: Pause auto-updates when user is actively scrolling
- **Time-sensitive content**: Show "2 minutes ago" vs "2m" for recent sports updates
- **Breaking news treatments**: Full-width banners for major breaking news

### **Community Engagement Patterns**
- **Reaction speed**: One-tap reactions with team-specific emojis
- **Thread visualization**: Clear parent-child relationships in game discussions
- **User identity**: Show team affiliations through subtle avatar treatments
- **Activity indicators**: Show when friends are actively watching same game

---

## 📸 **Camera & AR Interface Rules**

### **Camera-First Design**
- **Swipe accessibility**: Camera accessible via right swipe from main feed
- **Floating UI elements**: All camera controls use glassmorphic floating design
- **Gesture controls**: Tap to capture, hold for video, pinch to zoom
- **Quick access**: One-tap access to most recent AR filters

### **AR Overlay Standards**
- **Semi-transparent backgrounds**: 20-40% opacity for overlay panels
- **Blur backdrop filters**: Use backdrop-blur for text readability over camera feed
- **Minimal text overlay**: Keep text overlays under 2 lines when possible
- **Safe zones**: Maintain 24pt margins from screen edges for AR elements

### **Filter & Effect UI**
- **Horizontal scrollable**: AR filters in horizontal scrollable list at bottom
- **Preview thumbnails**: Show filter effect in thumbnail preview
- **Team-specific grouping**: Group filters by user's favorite teams first
- **Quick selection**: Double-tap filter thumbnail to apply immediately

---

## 🗣️ **Community & Messaging UI**

### **Fan Community Design**
- **Team color theming**: Community backgrounds use subtle team color gradients
- **Hierarchy indicators**: Clear visual hierarchy for different user roles (verified fans, moderators)
- **Activity streams**: Chronological activity with clear time stamps
- **Engagement metrics**: Show community size, active users, trending topics

### **Group Messaging Patterns**
- **Game-time optimization**: Larger text, higher contrast for use during games
- **Quick reactions**: Emoji reactions positioned for one-handed use
- **Media integration**: Seamless image/video sharing within conversations
- **Live typing indicators**: Show when multiple users are typing in group chats

### **Notification Hierarchy**
- **Critical sports updates**: Full-screen takeovers for major game events
- **Friend activity**: Standard notification banners
- **Community activity**: Grouped notifications to avoid spam
- **Personalized alerts**: AI-curated notifications based on user interests

---

## 🎨 **Content Display Standards**

### **Typography Hierarchy**
- **Headlines**: Bold, large typography for scores and breaking news
- **Body text**: High contrast, readable in outdoor lighting conditions
- **Captions**: Smaller text with adequate line spacing for mobile reading
- **Interactive elements**: Button text uses action-oriented language

### **Image & Video Handling**
- **Aspect ratio consistency**: Maintain 9:16 ratio for stories, 1:1 for posts
- **Loading states**: Show blurred placeholder while high-res images load
- **Compression optimization**: Balance quality with loading speed
- **Auto-play controls**: Muted auto-play with tap to unmute

### **Information Architecture**
- **Scannable layouts**: Users should be able to scan content in under 3 seconds
- **Consistent spacing**: Use 8pt grid system for all margins and padding
- **Visual grouping**: Related content grouped with consistent spacing and backgrounds
- **Clear CTAs**: Action buttons clearly distinguished from informational content

---

## ⚡ **Performance UI Guidelines**

### **Loading State Design**
- **Skeleton screens**: Match actual content layout structure
- **Progressive loading**: Load above-the-fold content first
- **Error states**: Clear error messages with retry options
- **Offline indicators**: Show when content is cached vs live

### **Animation Standards**
- **60fps requirement**: All animations must maintain 60fps on mid-range devices
- **Meaningful motion**: Animations should guide user attention, not distract
- **Reduced motion support**: Respect user's reduced motion preferences
- **Timing functions**: Use ease-out for entering elements, ease-in for exiting

### **Memory Management**
- **Image cleanup**: Automatically clean up off-screen images
- **Video optimization**: Pause videos when not visible
- **List virtualization**: Use virtualized lists for long content feeds
- **Background tasks**: Minimize processing when app is backgrounded

---

## 🌙 **Adaptive Theming Rules**

### **Light/Dark Mode Standards**
- **Automatic switching**: Switch based on system preferences by default
- **Manual override**: Allow users to override system preferences
- **Content adaptation**: Ensure all content remains readable in both modes
- **Team color compatibility**: Team colors work in both light and dark themes

### **Environmental Adaptation**
- **Outdoor mode**: Higher contrast ratios for bright sunlight usage
- **Game day mode**: Optimized for stadium/bar environments with poor lighting
- **Battery saving mode**: Reduce animations and lower refresh rates
- **Accessibility modes**: Support for various vision and motor accessibility needs

---

## 🎯 **Interaction Design Patterns**

### **Navigation Patterns**
- **Bottom tab navigation**: Maximum 5 primary sections
- **Swipe gestures**: Left/right swipes for horizontal navigation
- **Modal presentations**: Full-screen modals for immersive experiences
- **Back navigation**: Clear back button placement and gesture support

### **Feedback Systems**
- **Haptic feedback**: Subtle haptics for successful actions
- **Visual feedback**: Color changes and micro-animations for button presses
- **Audio feedback**: Optional sound effects for notifications and actions
- **Progress indicators**: Clear progress for multi-step actions

### **Error Prevention**
- **Confirmation dialogs**: For destructive actions (delete, block, report)
- **Input validation**: Real-time validation with helpful error messages
- **Undo functionality**: Allow users to undo recent actions
- **Auto-save**: Automatically save user content and preferences

---

## 📊 **Data Visualization Standards**

### **Sports Statistics Display**
- **Prominent numbers**: Large, bold fonts for key statistics
- **Comparative layouts**: Easy comparison between players/teams
- **Color coding**: Use team colors for data visualization
- **Interactive elements**: Tap to drill down into detailed statistics

### **Real-Time Updates**
- **Animation transitions**: Smooth transitions when data updates
- **Highlight changes**: Briefly highlight updated information
- **Loading indicators**: Show when data is being refreshed
- **Time stamps**: Clear indication of when data was last updated

---

## 🔧 **Technical Implementation Guidelines**

### **React Native Optimization**
- **FlatList usage**: Use FlatList for all scrollable content lists
- **Image optimization**: Use FastImage for better performance
- **State management**: Minimize re-renders through proper state structure
- **Bundle optimization**: Code splitting for different app sections

### **NativeWind Integration**
- **Utility-first approach**: Use Tailwind utilities over custom styles
- **Responsive breakpoints**: Design for different screen sizes
- **Custom utilities**: Create app-specific utilities for repeated patterns
- **Performance classes**: Use performance-optimized classes for animations

### **Accessibility Requirements**
- **Screen reader support**: All interactive elements have proper labels
- **Color contrast**: Minimum 4.5:1 contrast ratio for text
- **Touch targets**: Minimum 44pt touch targets for all buttons
- **Navigation flow**: Logical tab order for screen reader users

---

## 🚀 **Success Metrics for UI**

### **Performance Metrics**
- **Load time**: Main feed loads in under 2 seconds
- **Frame rate**: Maintain 60fps during scrolling and animations
- **Memory usage**: Stay under 200MB RAM usage during normal operation
- **Battery impact**: Minimal battery drain during background usage

### **User Experience Metrics**
- **Task completion**: Users can complete primary tasks in under 3 taps
- **Error rate**: Less than 5% error rate for primary user flows
- **Accessibility**: Support for users with various accessibility needs
- **Engagement**: UI supports high engagement rates during live games

### **Design Consistency**
- **Component reuse**: 80% of UI built from reusable components
- **Brand compliance**: Consistent application of theme across all screens
- **Responsive design**: Optimal experience across all supported screen sizes
- **Cross-platform parity**: Consistent experience between iOS and Android 