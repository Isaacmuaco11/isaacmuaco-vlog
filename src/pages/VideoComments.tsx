import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Trash2, Send, MessageCircle, CornerDownRight } from "lucide-react";
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
  parent_id: string | null;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  user_liked: boolean;
  replies?: Comment[];
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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

    // Fetch all comments including replies
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

      // Organize comments into threads
      const parentComments = commentsWithDetails.filter(c => !c.parent_id);
      const replies = commentsWithDetails.filter(c => c.parent_id);

      const threaded = parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(r => r.parent_id === parent.id).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));

      setComments(threaded);
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
      parent_id: replyingTo?.id || null,
    });

    if (error) {
      toast({ title: "Erro ao comentar", variant: "destructive" });
    } else {
      setNewComment("");
      setReplyingTo(null);
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

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div 
      key={comment.id} 
      className={`p-4 hover:bg-zinc-900/50 transition-colors ${isReply ? 'ml-12 border-l-2 border-zinc-800' : ''}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <button
          onClick={() => comment.profile?.username && navigate(`/@${comment.profile.username}`)}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
            <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center">
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => comment.profile?.username && navigate(`/@${comment.profile.username}`)}
              className="font-bold text-white hover:underline text-sm"
            >
              {comment.profile?.display_name || comment.profile?.username || "Usuário"}
            </button>
            <span className="text-zinc-500 text-sm">
              @{comment.profile?.username || "user"}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500 text-sm">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          <p className="text-white whitespace-pre-wrap break-words mt-1 text-[15px] leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            {/* Like */}
            <button
              onClick={() => handleLikeComment(comment.id, comment.user_liked)}
              className="flex items-center gap-1.5 group"
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  comment.user_liked
                    ? "fill-red-500 text-red-500"
                    : "text-zinc-500 group-hover:text-red-500"
                }`}
              />
              {comment.likes_count > 0 && (
                <span
                  className={`text-sm ${
                    comment.user_liked ? "text-red-500" : "text-zinc-500"
                  }`}
                >
                  {formatNumber(comment.likes_count)}
                </span>
              )}
            </button>

            {/* Reply */}
            {!isReply && (
              <button
                onClick={() => setReplyingTo({ id: comment.id, username: comment.profile?.username || "user" })}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Responder</span>
              </button>
            )}

            {/* Delete */}
            {user?.id === comment.user_id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Replies Toggle */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="flex items-center gap-2 mt-3 text-blue-500 hover:text-blue-400 transition-colors text-sm"
            >
              <CornerDownRight className="w-4 h-4" />
              {expandedReplies.has(comment.id) 
                ? "Ocultar respostas" 
                : `Ver ${comment.replies.length} resposta${comment.replies.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Comentários</h1>
            <p className="text-sm text-zinc-500">
              {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} comentários
            </p>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">Nenhum comentário ainda</p>
            <p className="text-sm">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {comments.map((comment) => (
              <div key={comment.id}>
                {renderComment(comment)}
                {/* Render replies if expanded */}
                {expandedReplies.has(comment.id) && comment.replies && (
                  <div className="bg-zinc-900/30">
                    {comment.replies.map((reply) => renderComment(reply, true))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-3 safe-area-inset-bottom">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-zinc-900 rounded-lg">
            <span className="text-sm text-zinc-400">
              Respondendo a <span className="text-blue-500">@{replyingTo.username}</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-auto text-zinc-500 hover:text-white text-sm"
            >
              Cancelar
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmitComment} className="flex gap-3 items-center">
          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.email?.[0].toUpperCase() || "?"}
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? (replyingTo ? "Escreva uma resposta..." : "Adicionar comentário...") : "Faça login para comentar"}
              disabled={!user}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="p-2.5 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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