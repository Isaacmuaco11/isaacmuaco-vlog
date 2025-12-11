import { X, LogIn, LogOut, UserPlus, Settings } from "lucide-react";
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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
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
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-zinc-400">Logado como:</p>
                <p className="text-white font-medium truncate">{user.email}</p>
              </div>
              
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
