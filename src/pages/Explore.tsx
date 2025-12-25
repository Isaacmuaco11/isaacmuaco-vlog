import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/assets/verified-badge.svg";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  isFollowing?: boolean;
}

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const fetchProfiles = async (query: string) => {
    setLoading(true);
    
    let queryBuilder = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (query.trim()) {
      queryBuilder = queryBuilder.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
    }

    const { data: profilesData } = await queryBuilder;

    if (profilesData && user) {
      // Get following status for all profiles
      const { data: followingData } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingSet = new Set(followingData?.map(f => f.following_id) || []);
      setFollowing(followingSet);

      setProfiles(profilesData.filter(p => p.user_id !== user.id));
    } else {
      setProfiles(profilesData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles(searchQuery);
  }, [searchQuery, user]);

  const handleFollow = async (profileUserId: string) => {
    if (!user) {
      toast({ title: "Faça login para seguir", variant: "destructive" });
      return;
    }

    const isCurrentlyFollowing = following.has(profileUserId);

    if (isCurrentlyFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileUserId);
      
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileUserId);
        return newSet;
      });
    } else {
      await supabase.from("followers").insert({
        follower_id: user.id,
        following_id: profileUserId,
      });
      
      setFollowing(prev => new Set(prev).add(profileUserId));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-800 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar pessoas..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2.5 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          
          <button className="p-2 hover:bg-zinc-800 rounded-full">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="pb-20">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum resultado encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
              >
                {/* Avatar */}
                <button
                  onClick={() => navigate(`/@${profile.username}`)}
                  className="flex-shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                        {(profile.display_name || profile.username || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => navigate(`/@${profile.username}`)}>
                  <div className="flex items-center gap-1">
                    <span className="font-bold truncate">
                      {profile.display_name || profile.username}
                    </span>
                    {profile.is_verified && (
                      <img src={VerifiedBadge} alt="Verified" className="w-4 h-4" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    @{profile.username}
                  </p>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(profile.user_id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    following.has(profile.user_id)
                      ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {following.has(profile.user_id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      A seguir
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Seguir
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;