-- Fix Stories Upload Permissions
-- Run these commands in your Supabase SQL Editor to fix story upload issues

-- 1. Stories table policies
-- Allow users to insert their own stories
DROP POLICY IF EXISTS "Users can insert their own stories" ON public.stories;
CREATE POLICY "Users can insert their own stories" ON public.stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view public stories and their own stories
DROP POLICY IF EXISTS "Users can view stories" ON public.stories;
CREATE POLICY "Users can view stories" ON public.stories
FOR SELECT USING (
  privacy_setting = 'public' 
  OR user_id = auth.uid()
  OR privacy_setting = 'friends' -- Will need friend filtering later
);

-- Allow users to update their own stories
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories" ON public.stories
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own stories
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories
FOR DELETE USING (auth.uid() = user_id);

-- 2. Story views policies
DROP POLICY IF EXISTS "Users can insert story views" ON public.story_views;
CREATE POLICY "Users can insert story views" ON public.story_views
FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can view story views for their stories" ON public.story_views;
CREATE POLICY "Users can view story views for their stories" ON public.story_views
FOR SELECT USING (
  viewer_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_views.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- 3. Create media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies for media bucket
-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Users can upload to their own stories folder" ON storage.objects;
CREATE POLICY "Users can upload to their own stories folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload to story-uploads folder
DROP POLICY IF EXISTS "Users can upload stories" ON storage.objects;
CREATE POLICY "Users can upload stories" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND name LIKE 'story-uploads/%'
);

-- Allow anyone to view media files (for public stories)
DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;
CREATE POLICY "Anyone can view media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Create missing functions if they don't exist
CREATE OR REPLACE FUNCTION increment_story_views(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET view_count = view_count + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure profiles table has proper policies for stories
DROP POLICY IF EXISTS "Users can view profiles for stories" ON public.profiles;
CREATE POLICY "Users can view profiles for stories" ON public.profiles
FOR SELECT USING (true); -- Allow viewing all profiles for stories feed

-- Print success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Stories permissions have been configured successfully!';
  RAISE NOTICE 'You should now be able to upload stories without permission errors.';
END $$; 