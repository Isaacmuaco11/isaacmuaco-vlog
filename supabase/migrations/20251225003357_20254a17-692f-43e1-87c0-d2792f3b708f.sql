-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS policies for followers
CREATE POLICY "Anyone can view followers" 
ON public.followers FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can follow" 
ON public.followers FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.followers FOR DELETE 
USING (auth.uid() = follower_id);

-- Add cover_url and bio to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update isaacmuaco582@gmail.com profile to be verified
UPDATE public.profiles 
SET is_verified = true 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'isaacmuaco582@gmail.com'
);

-- Add user_id to videos table so users can upload their own videos
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update RLS for videos to allow authenticated users to upload
DROP POLICY IF EXISTS "Admins can insert videos" ON public.videos;

CREATE POLICY "Authenticated users can insert videos" 
ON public.videos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
ON public.videos FOR DELETE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create covers storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-videos', 'user-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for covers bucket
CREATE POLICY "Avatar covers are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own cover" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS for user-videos bucket
CREATE POLICY "User videos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-videos');

CREATE POLICY "Users can upload their own videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'user-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'user-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);