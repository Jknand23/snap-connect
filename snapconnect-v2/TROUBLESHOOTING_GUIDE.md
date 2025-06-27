# 🛠 SnapConnect V2 - Troubleshooting Guide

## Issue: Theme Changes Not Visible

If you're not seeing the visual theme changes or the sign-in button appears harder to see, follow these steps:

### 1. **Clear Metro Cache** (Most Common Solution)
```bash
# In your terminal, navigate to the snapconnect-v2 folder and run:
npx expo start --clear

# Or alternatively:
npx expo r -c

# This clears the Metro bundler cache and forces a fresh rebuild
```

### 2. **Restart Development Server**
```bash
# Stop the current Expo development server (Ctrl+C)
# Then restart with:
npx expo start

# Make sure to refresh/reload your app after restart
```

### 3. **Verify NativeWind Setup**

Check that these files match exactly:

**babel.config.js** should contain:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

**metro.config.js** should contain:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 4. **Test NativeWind is Working**

Add this temporary test to your LoginScreen to verify styling is working:

```tsx
// Add this test div at the top of your LoginScreen render method
<View className="bg-red-500 p-4 m-4">
  <Text className="text-white text-center font-bold">
    🔥 If you see this red box, NativeWind is working!
  </Text>
</View>
```

### 5. **Force Button Visibility Fix**

If the button is still hard to see, temporarily add inline styles:

```tsx
<Button
  title="Sign In"
  variant="primary"
  style={{
    backgroundColor: '#3B82F6', // Force blue background
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  }}
/>
```

### 6. **Complete Development Server Reset**
```bash
# 1. Stop the development server (Ctrl+C)
# 2. Clear all caches
npx expo install --fix
npx expo start --clear

# 3. If still having issues, try:
rm -rf node_modules
npm install
npx expo start --clear
```

### 7. **Check for JavaScript Errors**

In the Expo development console, look for any errors related to:
- CSS parsing
- NativeWind compilation
- Import/export issues

### 8. **Verify Your Screens Match Implementation**

Make sure you're looking at the correct screens:
- **LoginScreen**: Should show enhanced styling with sports emojis
- **HomeScreen**: Should show cards with team colors and live indicators
- **Button Component**: Should have multiple variants (primary, team, glass, live)

### Expected Visual Changes:

✅ **Login Screen:**
- Sports emojis in header text
- Better input field styling
- Prominent blue sign-in button

✅ **Home Screen:**
- Dark theme with proper contrast
- Live indicators with pulsing animations
- Team color accents (red strips for NFL, etc.)
- Enhanced card layouts with shadows

✅ **Buttons:**
- Multiple variants (primary=blue, team=dynamic, live=red pulsing)
- Better contrast and visibility

---

## 🚨 **If Nothing Works:**

1. **Check you're in the right directory:**
   ```bash
   cd snapconnect-v2
   pwd  # Should show the snapconnect-v2 folder path
   ```

2. **Verify the changes were saved:**
   - Check that `global.css` has the new CSS content
   - Check that `tailwind.config.js` has the enhanced configuration
   - Check that `LoginScreen.tsx` uses className instead of StyleSheet

3. **Use the fallback styling approach:**
   If NativeWind still isn't working, we can temporarily revert to StyleSheet with the new theme colors hard-coded.

---

## 📱 **Expected App Behavior:**

When working correctly, you should see:
- **Dramatic visual improvement** from plain styling
- **Sports-themed colors** throughout the app
- **Live pulsing indicators** for real-time content
- **Team color integration** in various UI elements
- **Enhanced typography** with proper hierarchy
- **Professional card layouts** with shadows and proper spacing

If you're still seeing the old plain styling, the Metro cache needs to be cleared! 🔄 