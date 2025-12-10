import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import HeartAnimation from "./HeartAnimation";

interface Video {
  id: string;
  video_url: string;
  title: string | null;
}

interface VideoStats {
  likes: number;
  views: number;
  userLiked: boolean;
}

const VideoFeed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoStats, setVideoStats] = useState<Record<string, VideoStats>>({});
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch videos from database
  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching videos:", error);
        return;
      }

      setVideos(data || []);
    };

    fetchVideos();
  }, []);

  // Fetch stats for all videos
  const fetchStats = useCallback(async () => {
    if (videos.length === 0) return;

    const stats: Record<string, VideoStats> = {};

    for (const video of videos) {
      const { count: likesCount } = await supabase
        .from("video_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", video.id);

      const { count: viewsCount } = await supabase
        .from("video_views")
        .select("*", { count: "exact", head: true })
        .eq("video_id", video.id);

      let userLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from("video_likes")
          .select("id")
          .eq("video_id", video.id)
          .eq("user_id", user.id)
          .maybeSingle();
        userLiked = !!likeData;
      }

      stats[video.id] = {
        likes: likesCount || 0,
        views: viewsCount || 0,
        userLiked,
      };
    }

    setVideoStats(stats);
  }, [videos, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Record view when video is watched
  const recordView = async (videoId: string) => {
    if (!user) return;

    await supabase.from("video_views").upsert(
      { video_id: videoId, user_id: user.id },
      { onConflict: "video_id,user_id" }
    );
    fetchStats();
  };

  // Handle like
  const handleLike = async (videoId: string) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Precisa fazer login para curtir",
        variant: "destructive",
      });
      return;
    }

    const stats = videoStats[videoId];
    if (stats?.userLiked) {
      // Unlike
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
    } else {
      // Like
      await supabase.from("video_likes").insert({
        video_id: videoId,
        user_id: user.id,
      });
      setShowHeartAnimation(videoId);
    }

    fetchStats();
  };

  // Intersection observer for autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const index = videoRefs.current.indexOf(video);
          
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            video.muted = false;
            if (index !== -1) {
              setCurrentIndex(index);
              if (videos[index]) {
                recordView(videos[index].id);
              }
            }
          } else {
            video.pause();
            video.muted = true;
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos]);

  // Calculate total views
  const totalViews = Object.values(videoStats).reduce(
    (sum, stat) => sum + stat.views,
    0
  );

  return (
    <div className="w-full bg-black">
      <div
        ref={containerRef}
        className="snap-y snap-mandatory h-[calc(100vh-60px)] overflow-y-scroll scrollbar-hide"
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="snap-start h-[calc(100vh-60px)] flex items-center justify-center bg-black relative"
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={video.video_url}
              className="w-full h-full object-cover cursor-pointer"
              loop
              playsInline
              muted
              onClick={() => handleLike(video.id)}
            />

            {/* Heart Animation */}
            {showHeartAnimation === video.id && (
              <HeartAnimation onComplete={() => setShowHeartAnimation(null)} />
            )}

            {/* Side Actions - YouTube Shorts Style */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6">
              {/* Like Button */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`p-3 rounded-full ${
                    videoStats[video.id]?.userLiked
                      ? "bg-transparent"
                      : "bg-transparent"
                  } transition-colors`}
                >
                  <Heart
                    className={`w-8 h-8 ${
                      videoStats[video.id]?.userLiked 
                        ? "fill-red-500 text-red-500" 
                        : "text-white"
                    }`}
                  />
                </div>
                <span className="text-white text-xs font-semibold">
                  {videoStats[video.id]?.likes || 0}
                </span>
              </button>

              {/* Views */}
              <div className="flex flex-col items-center gap-1">
                <div className="p-3">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {videoStats[video.id]?.views || 0}
                </span>
              </div>
            </div>

            {/* Video indicator dots */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {videos.map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${
                    i === index ? "h-4 bg-white" : "h-1 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total views footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm py-2 flex justify-center items-center gap-2 text-white/70 z-40">
        <Eye className="w-4 h-4" />
        <span className="text-sm">{totalViews} visualizações totais</span>
      </div>
    </div>
  );
};

export default VideoFeed;
