import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CurrentUserDto } from "../types/project";
import * as api from "../api/client";

interface AuthContextValue {
  user: CurrentUserDto | null;
  loading: boolean;
  error: string | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await api.fetchCurrentUser();
      setUser(me);
    } catch (e) {
      api.setAuthToken(null);
      setUser(null);
      setError(e instanceof Error ? e.message : "Błąd sesji");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (credential: string) => {
      setLoading(true);
      setError(null);
      try {
        const { user: me } = await api.loginWithGoogle(credential);
        setUser(me);
      } catch (e) {
        api.setAuthToken(null);
        setUser(null);
        setError(e instanceof Error ? e.message : "Błąd logowania");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    api.logoutApi().catch(() => {});
    api.setAuthToken(null);
    setUser(null);
    setError(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isGuest = user?.role === "guest";

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      isAdmin,
      isGuest,
    }),
    [user, loading, error, login, logout, isAdmin, isGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
