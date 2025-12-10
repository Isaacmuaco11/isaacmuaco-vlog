import { useState } from "react";
import { Menu, X, LogIn, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
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
          setIsOpen(false);
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
          setIsOpen(false);
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
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Logado como: <span className="text-foreground">{user.email}</span>
              </p>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 p-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 p-2 rounded-lg transition-colors ${
                    isLogin
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <LogIn className="w-4 h-4 mx-auto mb-1" />
                  Entrar
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 p-2 rounded-lg transition-colors ${
                    !isLogin
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <UserPlus className="w-4 h-4 mx-auto mb-1" />
                  Criar Conta
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
