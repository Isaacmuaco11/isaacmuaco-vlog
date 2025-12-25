import { useRef, useEffect, useState, useCallback } from "react";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, UserPlus, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import HeartAnimation from "./HeartAnimation";
import { formatNumber } from "@/lib/formatNumber";

interface Video {
  id: string;
  video_url: string;
  title: string | null;
}

interface VideoStats {
  likes: number;
  views: number;
  userLiked: boolean;
  commentsCount: number;
  sharesCount: number;
  recentViewers: { avatar_url: string | null; username: string | null }[];
  authorProfile?: {
    avatar_url: string | null;
    username: string | null;
    display_name: string | null;
  };
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
  const navigate = useNavigate();

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

      const { count: commentsCount } = await supabase
        .from("video_comments")
        .select("*", { count: "exact", head: true })
        .eq("video_id", video.id);

      const { count: sharesCount } = await supabase
        .from("video_shares")
        .select("*", { count: "exact", head: true })
        .eq("video_id", video.id);

      // Get recent viewers with profiles
      const { data: recentViews } = await supabase
        .from("video_views")
        .select("user_id")
        .eq("video_id", video.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const recentViewers: { avatar_url: string | null; username: string | null }[] = [];
      if (recentViews) {
        for (const view of recentViews) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url, username")
            .eq("user_id", view.user_id)
            .maybeSingle();
          recentViewers.push({
            avatar_url: profile?.avatar_url || null,
            username: profile?.username || null,
          });
        }
      }

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

      // Get a random profile as author (since we don't have author_id in videos)
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("avatar_url, username, display_name")
        .limit(1)
        .maybeSingle();

      stats[video.id] = {
        likes: likesCount || 0,
        views: viewsCount || 0,
        userLiked,
        commentsCount: commentsCount || 0,
        sharesCount: sharesCount || 0,
        recentViewers,
        authorProfile: authorProfile || undefined,
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
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("video_likes").insert({
        video_id: videoId,
        user_id: user.id,
      });
      setShowHeartAnimation(videoId);
    }

    fetchStats();
  };

  // Handle share
  const handleShare = async (videoId: string, videoTitle: string | null) => {
    const shareUrl = `${window.location.origin}/video/${videoId}`;
    const shareText = videoTitle || "Confira este vídeo incrível!";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl,
        });

        // Record share
        if (user) {
          await supabase.from("video_shares").insert({
            video_id: videoId,
            user_id: user.id,
          });
          fetchStats();
        }

        toast({ title: "Compartilhado com sucesso!" });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareUrl);
          toast({ title: "Link copiado!" });
        }
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      if (user) {
        await supabase.from("video_shares").insert({
          video_id: videoId,
          user_id: user.id,
        });
        fetchStats();
      }

      toast({ title: "Link copiado para a área de transferência!" });
    }
  };

  // Intersection observer for autoplay with proper sound handling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const index = videoRefs.current.indexOf(video);
          
          if (entry.isIntersecting) {
            // Play and unmute the visible video
            video.currentTime = 0;
            video.muted = false;
            video.play().catch(() => {
              // If autoplay fails, try with muted
              video.muted = true;
              video.play().catch(() => {});
            });
            
            if (index !== -1) {
              setCurrentIndex(index);
              if (videos[index]) {
                recordView(videos[index].id);
              }
            }
          } else {
            // Pause and mute non-visible videos
            video.pause();
            video.muted = true;
            video.currentTime = 0;
          }
        });
      },
      { threshold: 0.7 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos]);

  return (
    <div className="w-full bg-black min-h-screen">
      {/* Facebook Reels Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-white font-bold text-2xl">Reels</h1>
          <div className="flex items-center gap-4">
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="text-white relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="snap-y snap-mandatory h-screen overflow-y-scroll scrollbar-hide"
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="snap-start h-screen flex items-center justify-center bg-black relative"
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={video.video_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted
              onClick={() => {
                const videoEl = videoRefs.current[index];
                if (videoEl) {
                  if (videoEl.paused) {
                    videoEl.play();
                  } else {
                    videoEl.pause();
                  }
                }
              }}
            />

            {/* Heart Animation */}
            {showHeartAnimation === video.id && (
              <HeartAnimation onComplete={() => setShowHeartAnimation(null)} />
            )}

            {/* Fullscreen button */}
            <button className="absolute bottom-1/3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Ecrã completo
            </button>

            {/* Side Actions - Facebook Reels Style */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-6">
              {/* Like Button */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`p-2 rounded-full ${videoStats[video.id]?.userLiked ? 'bg-blue-500' : 'bg-zinc-800/80'}`}>
                  <ThumbsUp
                    className={`w-7 h-7 ${
                      videoStats[video.id]?.userLiked 
                        ? "fill-white text-white" 
                        : "text-white"
                    }`}
                  />
                </div>
                <span className="text-white text-sm font-semibold">
                  {formatNumber(videoStats[video.id]?.likes || 0)}
                </span>
              </button>

              {/* Comments Button */}
              <button
                onClick={() => navigate(`/video/${video.id}/comments`)}
                className="flex flex-col items-center gap-1"
              >
                <div className="p-2 rounded-full bg-zinc-800/80">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">
                  {formatNumber(videoStats[video.id]?.commentsCount || 0)}
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => handleShare(video.id, video.title)}
                className="flex flex-col items-center gap-1"
              >
                <div className="p-2 rounded-full bg-zinc-800/80">
                  <Share2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">
                  {formatNumber(videoStats[video.id]?.sharesCount || 0)}
                </span>
              </button>

              {/* More Options */}
              <button className="flex flex-col items-center gap-1">
                <div className="p-2">
                  <MoreHorizontal className="w-7 h-7 text-white" />
                </div>
              </button>
            </div>

            {/* Bottom Info - Facebook Reels Style */}
            <div className="absolute bottom-6 left-0 right-16 px-4">
              {/* Author Info */}
              <div className="flex items-center gap-3 mb-3">
                <div 
                  onClick={() => videoStats[video.id]?.authorProfile?.username && navigate(`/@${videoStats[video.id]?.authorProfile?.username}`)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 cursor-pointer"
                >
                  <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                    {videoStats[video.id]?.authorProfile?.avatar_url ? (
                      <img
                        src={videoStats[video.id]?.authorProfile?.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(videoStats[video.id]?.authorProfile?.username || "U")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <span 
                  onClick={() => videoStats[video.id]?.authorProfile?.username && navigate(`/@${videoStats[video.id]?.authorProfile?.username}`)}
                  className="text-white font-bold text-sm cursor-pointer hover:underline"
                >
                  {videoStats[video.id]?.authorProfile?.display_name || videoStats[video.id]?.authorProfile?.username || "Usuário"}
                </span>

                <button className="flex items-center gap-1 text-white text-sm">
                  <MapPin className="w-4 h-4" />
                </button>

                <button className="bg-white text-black font-bold px-4 py-1.5 rounded-md text-sm hover:bg-zinc-200 transition-colors">
                  Seguir
                </button>
              </div>

              {/* Title */}
              <p className="text-white text-sm leading-relaxed mb-2">
                {video.title || "Vídeo sem título"} 🔥
              </p>

              {/* Recent Viewers */}
              {videoStats[video.id]?.recentViewers && videoStats[video.id].recentViewers.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    {videoStats[video.id].recentViewers.slice(0, 3).map((viewer, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-black bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden"
                      >
                        {viewer.avatar_url ? (
                          <img
                            src={viewer.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white">
                            {(viewer.username || "?")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/70 text-xs">
                    {formatNumber(videoStats[video.id]?.views || 0)}+ visualizações
                  </span>
                </div>
              )}
            </div>

            {/* Progress Line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-600">
              <div className="h-full bg-white w-0 animate-pulse" style={{ width: index === currentIndex ? '100%' : '0%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;