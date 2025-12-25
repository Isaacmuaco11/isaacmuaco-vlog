import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MoreHorizontal, Grid, Film, Image, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatNumber";
import VerifiedBadge from "@/assets/verified-badge.svg";

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("reels");
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user && profile && user.id === profile.user_id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      const cleanUsername = username.replace('@', '');
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (!profileData) {
        navigate("/");
        return;
      }

      setProfile(profileData);

      const { count: followers } = await supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", profileData.user_id);
      const { count: following } = await supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", profileData.user_id);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      if (user) {
        const { data: followData } = await supabase.from("followers").select("id").eq("follower_id", user.id).eq("following_id", profileData.user_id).maybeSingle();
        setIsFollowing(!!followData);
      }

      const { data: videosData } = await supabase.from("videos").select("*").eq("user_id", profileData.user_id).order("created_at", { ascending: false });
      setVideos(videosData || []);
      setLoading(false);
    };
    fetchProfile();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", profile.user_id);
    } else {
      await supabase.from("followers").insert({ follower_id: user.id, following_id: profile.user_id });
    }
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const bucket = type === 'avatar' ? 'avatars' : type === 'cover' ? 'covers' : 'user-videos';
    const filePath = `${user.id}/${type === 'video' ? Date.now() : type}.${file.name.split('.').pop()}`;
    
    await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    if (type === 'video') {
      await supabase.from('videos').insert({ video_url: urlData.publicUrl, title: file.name, user_id: user.id });
    } else {
      await supabase.from('profiles').update({ [type === 'avatar' ? 'avatar_url' : 'cover_url']: urlData.publicUrl }).eq('user_id', user.id);
    }
    setUploading(false);
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'cover')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleUpload(e, 'video')} />

      <div className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-800 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <span className="font-bold">{profile.display_name || profile.username}</span>
            {profile.is_verified && <img src={VerifiedBadge} alt="Verified" className="w-5 h-5" />}
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="relative h-48 bg-gradient-to-br from-zinc-700 to-zinc-800">
        {profile.cover_url && <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />}
        {isOwnProfile && <button onClick={() => coverInputRef.current?.click()} className="absolute bottom-3 right-3 p-2 bg-zinc-900/80 rounded-full"><Camera className="w-5 h-5" /></button>}
      </div>

      <div className="px-4 pb-4 -mt-16 relative">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full border-4 border-blue-500 bg-zinc-800 overflow-hidden">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-400">{(profile.display_name || profile.username || "?")[0].toUpperCase()}</div>}
          </div>
          {isOwnProfile && <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-2 right-2 p-2 bg-zinc-800 rounded-full border-2 border-zinc-900"><Camera className="w-4 h-4" /></button>}
          {profile.is_verified && <div className="absolute bottom-0 left-0 p-1 bg-zinc-900 rounded-full"><img src={VerifiedBadge} alt="Verified" className="w-6 h-6" /></div>}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>{profile.is_verified && <img src={VerifiedBadge} alt="Verified" className="w-6 h-6" />}</div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span><span className="font-bold">{formatNumber(followersCount)}</span><span className="text-zinc-400 ml-1">seguidores</span></span>
            <span className="text-zinc-600">·</span>
            <span><span className="font-bold">{formatNumber(followingCount)}</span><span className="text-zinc-400 ml-1">a seguir</span></span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {isOwnProfile ? (
            <>
              <button onClick={() => videoInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg">+ Publicar vídeo</button>
              <button className="p-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg"><MoreHorizontal className="w-5 h-5" /></button>
            </>
          ) : (
            <>
              <button onClick={handleFollow} className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-lg ${isFollowing ? "bg-zinc-700 hover:bg-zinc-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                {isFollowing ? <><Check className="w-5 h-5" />A seguir</> : <><UserPlus className="w-5 h-5" />Seguir</>}
              </button>
              <button className="flex-1 bg-zinc-700 hover:bg-zinc-600 font-bold py-2.5 rounded-lg">Mensagem</button>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-zinc-800 flex">
        {["publications", "about", "reels", "photos"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-sm font-medium relative ${activeTab === tab ? "text-blue-500" : "text-zinc-400"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "reels" && (
          <div className="grid grid-cols-3 gap-1">
            {videos.map((video) => (
              <div key={video.id} className="aspect-[9/16] bg-zinc-800 rounded-lg overflow-hidden">
                <video src={video.video_url} className="w-full h-full object-cover" muted playsInline />
              </div>
            ))}
            {videos.length === 0 && <div className="col-span-3 text-center py-10 text-zinc-500"><Film className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum vídeo ainda</p></div>}
          </div>
        )}
        {activeTab !== "reels" && <div className="text-center py-10 text-zinc-500"><Grid className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum conteúdo ainda</p></div>}
      </div>

      {uploading && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
};

export default Profile;