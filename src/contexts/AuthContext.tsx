import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { IS_LOVABLE } from "@/lib/environment";
import { supabase } from "@/integrations/supabase/client";
import api from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AdminUser; token: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (IS_LOVABLE) {
        // Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const { data } = await supabase.from('admin_sessions')
            .select('*')
            .eq('admin_id', session.user.id)
            .eq('status', 'active')
            .limit(1);
          
          // Get user info from users table or use session metadata
          const adminUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            role: session.user.user_metadata?.role || 'admin',
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setUser(adminUser);
        }
      } else {
        // Laravel auth
        const token = localStorage.getItem("admin_token");
        const savedUser = localStorage.getItem("admin_user");
        if (token && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser) as AdminUser;
            try {
              const { data } = await api.get("/admin/me");
              if (data?.id && mounted) setUser(parsedUser);
              else {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
              }
            } catch {
              localStorage.removeItem("admin_token");
              localStorage.removeItem("admin_user");
            }
          } catch {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
          }
        }
      }
      if (mounted) setLoading(false);
    };

    initializeAuth();
    return () => { mounted = false; };
  }, []);

  const signIn = async (username: string, password: string) => {
    if (IS_LOVABLE) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });
      if (error) throw new Error(error.message);
      const adminUser: AdminUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email || '',
        role: data.user.user_metadata?.role || 'admin',
        avatar_url: data.user.user_metadata?.avatar_url,
      };
      setUser(adminUser);
      return { user: adminUser, token: data.session?.access_token || '' };
    }

    // Laravel login
    const { data } = await api.post("/admin/login", { email: username, password });
    if (!data?.user || !data?.token) throw new Error(data?.error || "Login failed");
    const adminUser: AdminUser = data.user;
    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_user", JSON.stringify(adminUser));
    setUser(adminUser);
    return { user: adminUser, token: data.token };
  };

  const signOut = async () => {
    if (IS_LOVABLE) {
      await supabase.auth.signOut();
    } else {
      try { await api.post("/admin/logout"); } catch {}
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const fallbackAuth: AuthContextType = {
  user: null,
  loading: true,
  signIn: async () => { throw new Error("AuthProvider not mounted"); },
  signOut: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context ?? fallbackAuth;
};
