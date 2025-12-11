import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatNumber } from "@/lib/formatNumber";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  user_liked: boolean;
}

interface Video {
  id: string;
  title: string | null;
}

const VideoComments = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!videoId) return;

    const { data: videoData } = await supabase
      .from("videos")
      .select("id, title")
      .eq("id", videoId)
      .maybeSingle();

    if (!videoData) {
      toast({ title: "Vídeo não encontrado", variant: "destructive" });
      navigate("/");
      return;
    }

    setVideo(videoData);

    const { data: commentsData } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: false });

    if (commentsData) {
      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("user_id", comment.user_id)
            .maybeSingle();

          const { count: likesCount } = await supabase
            .from("comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          let userLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("comment_likes")
              .select("id")
              .eq("comment_id", comment.id)
              .eq("user_id", user.id)
              .maybeSingle();
            userLiked = !!likeData;
          }

          return {
            ...comment,
            profile: profile || undefined,
            likes_count: likesCount || 0,
            user_liked: userLiked,
          };
        })
      );

      setComments(commentsWithDetails);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [videoId, user]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Faça login para comentar", variant: "destructive" });
      return;
    }
    if (!newComment.trim() || !videoId) return;

    setSubmitting(true);

    const { error } = await supabase.from("video_comments").insert({
      video_id: videoId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast({ title: "Erro ao comentar", variant: "destructive" });
    } else {
      setNewComment("");
      fetchComments();
    }

    setSubmitting(false);
  };

  const handleLikeComment = async (commentId: string, userLiked: boolean) => {
    if (!user) {
      toast({ title: "Faça login para curtir", variant: "destructive" });
      return;
    }

    if (userLiked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      });
    }

    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("video_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    } else {
      fetchComments();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-white/10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-bold text-lg">Comentários</h1>
            <p className="text-sm text-zinc-400">{comments.length} comentários</p>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <p className="text-lg mb-2">Nenhum comentário ainda</p>
            <p className="text-sm">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <button
                    onClick={() => comment.profile?.username && navigate(`/@${comment.profile.username}`)}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {comment.profile?.avatar_url ? (
                          <img
                            src={comment.profile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-zinc-400">
                            {(comment.profile?.display_name || comment.profile?.username || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => comment.profile?.username && navigate(`/@${comment.profile.username}`)}
                        className="font-bold hover:underline"
                      >
                        {comment.profile?.display_name || comment.profile?.username || "Usuário"}
                      </button>
                      <span className="text-zinc-500 text-sm">
                        @{comment.profile?.username || "user"}
                      </span>
                      <span className="text-zinc-500 text-sm">·</span>
                      <span className="text-zinc-500 text-sm">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <p className="text-white whitespace-pre-wrap break-words mb-3">
                      {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLikeComment(comment.id, comment.user_liked)}
                        className="flex items-center gap-2 group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                          <Heart
                            className={`w-4 h-4 ${
                              comment.user_liked
                                ? "fill-pink-500 text-pink-500"
                                : "text-zinc-500 group-hover:text-pink-500"
                            } transition-colors`}
                          />
                        </div>
                        <span
                          className={`text-sm ${
                            comment.user_liked ? "text-pink-500" : "text-zinc-500"
                          }`}
                        >
                          {comment.likes_count > 0 && formatNumber(comment.likes_count)}
                        </span>
                      </button>

                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="flex items-center gap-2 group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-500 transition-colors" />
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="sticky bottom-0 bg-black border-t border-white/10 p-4">
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
              <span className="text-sm font-bold text-zinc-400">
                {user?.email?.[0].toUpperCase() || "?"}
              </span>
            </div>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Escreva um comentário..." : "Faça login para comentar"}
              disabled={!user}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="p-3 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoComments;
