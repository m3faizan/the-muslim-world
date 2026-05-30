import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch, setAuthToken } from "@/lib/api";

export type AuthUser = {
  id: string | number;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthResponse = AuthUser & { token: string };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) setUser((await res.json()) as AuthUser);
      else {
        setUser(null);
        setAuthToken(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.error ?? "Login failed");
    }
    const data: AuthResponse = await res.json();
    setAuthToken(data.token);
    setUser({
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      isAdmin: data.isAdmin,
    });
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.error ?? "Registration failed");
    }
    const data: AuthResponse = await res.json();
    setAuthToken(data.token);
    setUser({
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      isAdmin: data.isAdmin,
    });
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* noop */
    }
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
