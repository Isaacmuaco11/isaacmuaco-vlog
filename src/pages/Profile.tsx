import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error || !data) {
        toast({ title: "Perfil não encontrado", variant: "destructive" });
        navigate("/");
        return;
      }

      setProfile(data);
      setEditName(data.display_name || "");
      setIsOwnProfile(user?.id === data.user_id);
      setLoading(false);
    };

    fetchProfile();
  }, [username, user, navigate, toast]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !isOwnProfile) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user!.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("user_id", user!.id);

    if (updateError) {
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    } else {
      setProfile({ ...profile, avatar_url: publicUrl.publicUrl });
      toast({ title: "Foto atualizada!" });
    }

    setUploading(false);
  };

  const handleSaveName = async () => {
    if (!profile || !isOwnProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: editName })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Erro ao atualizar nome", variant: "destructive" });
    } else {
      setProfile({ ...profile, display_name: editName });
      setEditing(false);
      toast({ title: "Nome atualizado!" });
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{profile?.display_name || profile?.username}</h1>
            <p className="text-sm text-zinc-400">@{profile?.username}</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-8">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
              <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-zinc-400">
                    {(profile?.display_name || profile?.username || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div className="flex items-center gap-2 mb-2">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(profile?.display_name || "");
                  }}
                  className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{profile?.display_name || profile?.username}</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
              </>
            )}
          </div>

          <p className="text-zinc-400">@{profile?.username}</p>

          {/* Profile URL */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 w-full max-w-md">
            <p className="text-sm text-zinc-400 mb-1">Link do perfil:</p>
            <p className="text-blue-400 font-mono text-sm break-all">
              {window.location.origin}/@{profile?.username}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
