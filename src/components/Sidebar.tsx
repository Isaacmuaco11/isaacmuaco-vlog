import { X, LogIn, LogOut, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Erro ao entrar",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Bem-vindo!" });
          onClose();
          setEmail("");
          setPassword("");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Erro ao criar conta",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Conta criada com sucesso!" });
          onClose();
          setEmail("");
          setPassword("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Sessão terminada" });
    onClose();
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
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                    isLogin
                      ? "bg-red-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-sm">Entrar</span>
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                    !isLogin
                      ? "bg-red-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="text-sm">Criar Conta</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full p-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
