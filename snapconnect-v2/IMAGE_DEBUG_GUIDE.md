# Image Loading & Sending Debug Guide

This guide helps you debug the two main image-related issues in your SnapConnect app:

1. **App crashes after sending an image**
2. **Images don't load in chat**

## Step 1: Set Up Storage Bucket

### Run the Storage Setup Script

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the content from `database/setup_storage.sql`
4. Run the script

This will:
- Create the `media` bucket if it doesn't exist
- Set up proper RLS policies for upload/access
- Verify the configuration

### Verify Storage Setup

After running the script, check:
- Go to **Storage** in Supabase Dashboard
- Verify the `media` bucket exists and is **public**
- Check that policies are created under **Storage > Policies**

## Step 2: Test Storage Functionality

### Run the Debug Test

1. Start your app in development mode
2. Sign in to your account
3. Open the JavaScript console (Metro bundler or React Native debugger)
4. Run: `debugStorageTest()`

This will test:
- Bucket existence
- Authentication
- File upload permissions
- URL generation
- Image accessibility

### Expected Output

```
🧪 Starting storage debug test...

1. Testing bucket existence...
✅ Media bucket exists: {id: 'media', name: 'media', public: true, ...}

2. Testing authentication...
✅ Authenticated user: abc123...

3. Testing file upload...
✅ Upload successful: {path: '...', id: '...'}

4. Testing public URL generation...
✅ Public URL generated: https://...

5. Testing URL accessibility...
✅ URL is accessible: 200

6. Cleaning up test file...
✅ Test file cleaned up

🎉 Storage test completed successfully!
```

## Step 3: Debug Common Issues

### Issue: "Media bucket not found"

**Solution:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi']
);
```

### Issue: "Upload failed due to permissions"

**Solution:**
```sql
-- Run in Supabase SQL Editor
CREATE POLICY "Users can upload media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Media files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'media');
```

### Issue: "URL not accessible"

**Causes:**
1. Bucket is not public
2. File was not uploaded successfully
3. RLS policies blocking access

**Solution:**
1. Make bucket public in Supabase Dashboard
2. Check upload success in logs
3. Review and fix RLS policies

## Step 4: Debug Image Loading in Chat

### Check Console Output

When sending an image, look for these logs:

```
📤 Uploading to path: user-id/chat-media/filename.jpg
✅ Upload successful: {path: '...'}
✅ Media uploaded to: https://your-project.supabase.co/storage/v1/object/public/media/...
✅ Media URL is accessible
✅ Message sent successfully
```

### Image Loading Errors

If you see this error:
```
❌ Error loading image: {imageUrl: 'https://...', errorDetails: {...}, messageId: '...'}
```

**Troubleshooting steps:**

1. **Copy the image URL** from the error and paste it in a browser
2. **Check if the URL loads** - if not, the file wasn't uploaded properly
3. **Verify URL format** - should start with `https://` and contain your project ID

### Common URL Issues

❌ **Bad URL:** `undefined/media/user-id/file.jpg`
✅ **Good URL:** `https://abcdefg.supabase.co/storage/v1/object/public/media/user-id/file.jpg`

## Step 5: App Crash Prevention

### Error Boundaries

The app now includes:
- Better error logging for image loading failures
- Fallback behavior for invalid URLs
- Default image source for failed loads

### Improved Logging

New logging includes:
- Image URL validation before sending
- Upload success verification
- URL accessibility testing
- Detailed error information

## Testing Checklist

### Before Sending Images

- [ ] Storage bucket exists and is public
- [ ] RLS policies are correctly configured
- [ ] User is authenticated
- [ ] Debug test passes completely

### After Sending Images

- [ ] Check console for upload success logs
- [ ] Verify image URL is accessible in browser
- [ ] Confirm message appears in chat
- [ ] Test image loading by scrolling up/down in chat

## Environment Variables

Ensure these are set in your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Getting Help

If issues persist:

1. **Check Supabase logs** in Dashboard > Logs
2. **Review Storage policies** in Dashboard > Storage > Policies
3. **Test manual upload** in Dashboard > Storage > Upload file
4. **Share console output** from `debugStorageTest()` for support

## Quick Fixes

### Reset Everything

If all else fails:

1. Delete the `media` bucket in Supabase Dashboard
2. Run `database/setup_storage.sql` again
3. Test with `debugStorageTest()`
4. Try sending an image again

### Temporary Workaround

For testing without storage:
- Comment out media upload code in `CameraScreen.tsx`
- Use placeholder URLs for testing UI
- Focus on other app features while debugging storage 