import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Video, Upload, X, Eye, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface VideoItem {
  id: string;
  video_url: string;
  title: string | null;
  created_at: string;
  likes_count?: number;
  views_count?: number;
}

const Admin = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchVideos();
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const fetchVideos = async () => {
    setLoading(true);
    const { data: videosData, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      setLoading(false);
      return;
    }

    // Fetch stats for each video
    const videosWithStats = await Promise.all(
      (videosData || []).map(async (video) => {
        const { count: likesCount } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", video.id);

        const { count: viewsCount } = await supabase
          .from("video_views")
          .select("*", { count: "exact", head: true })
          .eq("video_id", video.id);

        return {
          ...video,
          likes_count: likesCount || 0,
          views_count: viewsCount || 0,
        };
      })
    );

    setVideos(videosWithStats);
    setLoading(false);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("videos").insert({
      video_url: newVideoUrl.trim(),
      title: newVideoTitle.trim() || null,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o vídeo",
        variant: "destructive",
      });
    } else {
      toast({ title: "Vídeo adicionado com sucesso!" });
      setNewVideoUrl("");
      setNewVideoTitle("");
      setShowAddModal(false);
      fetchVideos();
    }
    setSubmitting(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Tem certeza que deseja eliminar este vídeo?")) return;

    const { error } = await supabase.from("videos").delete().eq("id", videoId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível eliminar o vídeo",
        variant: "destructive",
      });
    } else {
      toast({ title: "Vídeo eliminado!" });
      fetchVideos();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Painel Admin</h1>
              <p className="text-sm text-white/50">Gerencie seus vídeos</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Adicionar Vídeo</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl text-white/60 mb-2">Nenhum vídeo ainda</h3>
            <p className="text-white/40 mb-6">Comece adicionando seu primeiro vídeo</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
            >
              Adicionar Vídeo
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex gap-4 items-center"
              >
                {/* Video preview */}
                <div className="w-32 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0">
                  <video
                    src={video.video_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                </div>

                {/* Video info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {video.title || "Sem título"}
                  </h3>
                  <p className="text-white/40 text-sm truncate">{video.video_url}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Heart className="w-4 h-4" />
                      <span>{video.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>{video.views_count}</span>
                    </div>
                    <span className="text-white/40 text-sm">
                      {new Date(video.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  className="p-3 hover:bg-red-500/20 rounded-xl transition-colors text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Adicionar Vídeo</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  URL do Vídeo *
                </label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  required
                  placeholder="https://exemplo.com/video.mp4"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="Nome do vídeo"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Adicionar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;