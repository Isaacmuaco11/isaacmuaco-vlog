-- Add parent_id to video_comments for reply functionality
ALTER TABLE public.video_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE;

-- Add shares table
CREATE TABLE IF NOT EXISTS public.video_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on video_shares
ALTER TABLE public.video_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_shares
CREATE POLICY "Anyone can view shares count" 
ON public.video_shares FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can share" 
ON public.video_shares FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON public.video_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_video_shares_video_id ON public.video_shares(video_id);