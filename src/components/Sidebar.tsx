import { X, LogIn, LogOut, UserPlus, Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setProfile(null);
        return;
      }
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleData);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(profileData);
    };
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Sessão terminada" });
    onClose();
  };

  const goToAuth = () => {
    onClose();
    navigate("/auth");
  };

  const goToAdmin = () => {
    onClose();
    navigate("/admin");
  };

  const goToProfile = () => {
    if (profile?.username) {
      onClose();
      navigate(`/@${profile.username}`);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-zinc-900 border-r border-white/10 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {user ? (
            <div className="space-y-4">
              {/* User Info with Avatar */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-zinc-400">
                          {user.email?.[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.email}</p>
                    {profile?.username && (
                      <p className="text-sm text-zinc-400">@{profile.username}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Button */}
              <button
                onClick={goToProfile}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all"
              >
                <User className="w-5 h-5" />
                Meu Perfil
              </button>
              
              {isAdmin && (
                <button
                  onClick={goToAdmin}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  Painel Admin
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={goToAuth}
                className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20"
              >
                <LogIn className="w-5 h-5" />
                Entrar
              </button>
              <button
                onClick={goToAuth}
                className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10"
              >
                <UserPlus className="w-5 h-5" />
                Criar Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
