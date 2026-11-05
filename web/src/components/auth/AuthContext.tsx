// AuthContext.tsx
import {
  createContext, useContext, useState, useEffect, useCallback,
  ReactNode, useMemo,
} from 'react';
import { User } from "../../types/auth"
import {
  apiFetch, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY,
  AUTH_LOGOUT_EVENT,
} from "../../api";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  /** True while a stored token is being validated on load. */
  authLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData?: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    const parsed = JSON.parse(userData);
    // Never trust a stored password: older builds saved one.
    if (parsed && typeof parsed === "object") delete parsed.password;
    return parsed;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [authLoading, setAuthLoading] = useState<boolean>(() => !!localStorage.getItem(ACCESS_TOKEN_KEY));

  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setAuthLoading(false);
  }, []);

  // Validate a stored token on load: a token in localStorage is not
  // proof of a live session. On success the fresh profile is stored;
  // on 401 (even after a refresh attempt) the session is cleared.
  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }
    let cancelled = false;
    apiFetch("/user")
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          logout();
          return;
        }
        const freshUser: User = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        setUser(freshUser);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, []); // once, on mount

  // The refresh flow in apiFetch fires this when the session is gone.
  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, logout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (accessToken: string, refreshToken: string, userData?: User) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setToken(accessToken);
    setAuthLoading(true);
    try {
      const profile: User = userData ?? (await (async () => {
        const res = await apiFetch("/user");
        if (!res.ok) throw new Error("Could not load profile");
        return (await res.json()) as User;
      })());
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    } catch {
      // Token is valid but the profile fetch failed; keep the token
      // and let the validation effect sort it out.
      if (userData) setUser(userData);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated,
    authLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
