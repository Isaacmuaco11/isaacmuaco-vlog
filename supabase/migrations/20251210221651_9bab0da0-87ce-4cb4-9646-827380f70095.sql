-- Videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Video views table
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Videos: everyone can view
CREATE POLICY "Anyone can view videos" ON public.videos FOR SELECT USING (true);

-- Likes: authenticated users can view and manage their own likes
CREATE POLICY "Anyone can view likes count" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add likes" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.video_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Views: authenticated users can view and add their own views
CREATE POLICY "Anyone can view views count" ON public.video_views FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add views" ON public.video_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Insert initial videos
INSERT INTO public.videos (video_url, title) VALUES
  ('/videos/video1.mp4', 'Vídeo 1'),
  ('/videos/video2.mp4', 'Vídeo 2'),
  ('/videos/video3.mp4', 'Vídeo 3'),
  ('/videos/video4.mp4', 'Vídeo 4'),
  ('/videos/video5.mp4', 'Vídeo 5'),
  ('/videos/video6.mp4', 'Vídeo 6');