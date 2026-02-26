-- 1. Enable pg_cron extension (Run this as superuser/postgres)
-- Note: In Supabase, you can enable this from the Dashboard -> Extensions
create extension if not exists pg_cron;

-- 2. Create the cleanup function
create or replace function public.delete_old_messages_and_orphaned_images()
returns void
language plpgsql
security definer
as $$
begin
    -- A. Delete messages older than 30 days
    delete from public.messages
    where created_at < now() - interval '30 days';

    -- B. Delete orphaned images from chat-images bucket
    -- We look for objects in 'chat-images' that are NOT present in the image_url column of the messages table
    -- Since image_url contains the full public URL, we might need to extract the path or match appropriately.
    -- Assuming storage objects are relative to the bucket.
    
    delete from storage.objects
    where bucket_id = 'chat-images'
    and name not in (
        -- Extract the filename/path from the message.image_url
        -- This logic depends on how the URL is stored. 
        -- If it's a full URL like '.../chat-images/filename.jpg', we extract the 'filename.jpg' part.
        select 
            substring(image_url from '/chat-images/(.+)$') 
        from public.messages 
        where image_url is not null
    )
    and created_at < now() - interval '1 day'; -- Buffer to avoid deleting images being uploaded right now
end;
$$;

-- 3. Schedule the job to run every day at midnight (00:00)
-- The cron expression is: '0 0 * * *'
select cron.schedule(
    'daily-cleanup-job',
    '0 0 * * *',
    'select public.delete_old_messages_and_orphaned_images();'
);

-- Instructions:
-- 1. Go to the Supabase SQL Editor.
-- 2. Paste and run this entire script.
-- 3. You can check scheduled jobs with: select * from cron.job;
-- 4. You can see job logs with: select * from cron.job_run_details;
