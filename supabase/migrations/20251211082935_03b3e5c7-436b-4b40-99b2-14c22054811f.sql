-- Add unique constraint for video views (for upsert to work)
ALTER TABLE public.video_views 
ADD CONSTRAINT video_views_video_user_unique UNIQUE (video_id, user_id);