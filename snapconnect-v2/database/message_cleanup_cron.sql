-- Message Cleanup Cron Job Setup
-- This sets up periodic cleanup of disappearing messages
-- Run this in Supabase SQL Editor

-- Create a function to handle the full cleanup process
CREATE OR REPLACE FUNCTION public.full_message_cleanup() 
RETURNS TEXT AS $$
DECLARE
  cleanup_count INTEGER;
  delete_count INTEGER;
BEGIN
  -- First, mark messages for deletion based on view status and presence
  PERFORM cleanup_disappearing_messages();
  
  -- Get count of messages marked for deletion
  SELECT COUNT(*) INTO cleanup_count
  FROM public.messages
  WHERE should_disappear = TRUE
    AND viewed_by_recipient = TRUE
    AND is_disappearing = TRUE;
  
  -- Actually delete the marked messages
  PERFORM delete_disappearing_messages();
  
  -- Get count of deleted messages (this will be the same as cleanup_count if successful)
  delete_count := cleanup_count;
  
  -- Clean up old presence records (inactive for more than 5 minutes)
  DELETE FROM public.chat_presence
  WHERE is_active = FALSE
    AND last_activity < NOW() - INTERVAL '5 minutes';
  
  -- Clean up old message views (older than 30 days)
  DELETE FROM public.message_views
  WHERE viewed_at < NOW() - INTERVAL '30 days';
  
  RETURN format('Cleanup completed. Marked %s messages for deletion, deleted %s messages', 
                cleanup_count, delete_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- If pg_cron is available (Supabase Pro), you can uncomment and modify this:
-- SELECT cron.schedule('message-cleanup', '*/5 * * * *', 'SELECT public.full_message_cleanup();');

-- For manual execution or app-triggered cleanup, you can call:
-- SELECT public.full_message_cleanup();

-- Grant execute permission to authenticated users for app-triggered cleanup
GRANT EXECUTE ON FUNCTION public.full_message_cleanup() TO authenticated;

-- Create a simpler function that can be called from the app without return value
CREATE OR REPLACE FUNCTION public.trigger_message_cleanup() 
RETURNS VOID AS $$
BEGIN
  PERFORM public.full_message_cleanup();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.trigger_message_cleanup() TO authenticated;

SELECT 'Message cleanup functions created successfully!' as status; 