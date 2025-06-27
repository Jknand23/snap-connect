# Flash Functionality Test Guide

## 🔦 Flash Testing Steps

### **Step 1: Basic Flash Test**
1. **Open Camera Screen** in your app
2. **Make sure you're using the BACK camera** (not front - front camera doesn't have flash)
3. **Tap the flash button** (lightning icon) in the top-right corner
4. **Watch for visual changes**:
   - Button should change color when flash is enabled
   - You should see a "⚡ ON" or "⚡ AUTO" indicator appear

### **Step 2: Flash Mode Cycling**
The flash button cycles through three modes:
- **OFF** (default): Gray button, no indicator
- **ON**: Yellow button, "⚡ ON" indicator  
- **AUTO**: Orange button, "⚡ AUTO" indicator
- **OFF**: Back to gray (cycles back)

### **Step 3: Take Photos with Flash**
1. **Set flash to ON** (yellow button)
2. **Take a photo** in a dark environment
3. **Check if the flash fires** when you tap the capture button
4. **Compare photos** taken with flash ON vs OFF

### **Step 4: Front Camera Test**
1. **Switch to front camera** (tap flip button)
2. **Try tapping flash button** - should show "Flash Not Available" alert
3. **Flash button should be grayed out** on front camera

## 🐛 Troubleshooting

### **If Flash Doesn't Fire:**
- Make sure you're using the **back camera**
- Try in a **darker environment** (flash may not be visible in bright light)
- Check that flash mode is set to **ON** (not AUTO or OFF)
- Restart the app and try again

### **If Flash Button Doesn't Change:**
- Check console logs for "📸 Taking photo with flash mode: [mode]"
- Make sure the button background color changes when tapped
- Verify the flash indicator appears at top-right when enabled

### **Device Limitations:**
- Some devices may have hardware limitations
- Emulators typically don't support flash
- Test on a **real device** for best results

## ✅ Expected Behavior

**Working Flash Should:**
- Button changes color when toggled (gray → yellow → orange → gray)
- Show visual indicator when enabled ("⚡ ON" or "⚡ AUTO")
- Actually fire the flash when taking photos in dark conditions
- Show "Flash Not Available" alert on front camera
- Console logs should show the correct flash mode

**Test in a dark room for best results!** 🌙 