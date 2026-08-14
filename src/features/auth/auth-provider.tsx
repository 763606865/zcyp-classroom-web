"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { configureHttpAuth, isApiError } from "@/lib/http";
import { getCurrentUser, loginWithSms } from "./api";
import { browserTokenStorage } from "./token-storage";
import type { AuthStatus, User } from "./types";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login(phone: string, code: string): Promise<User>;
  logout(): void;
  refreshUser(): Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    browserTokenStorage.remove();
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    configureHttpAuth({ getToken: browserTokenStorage.get, onUnauthorized: logout });
    return () => configureHttpAuth();
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const token = browserTokenStorage.get();
    if (!token) { setStatus("anonymous"); return null; }
    try {
      const result = await getCurrentUser(token);
      setUser(result.data.user);
      setStatus("authenticated");
      return result.data.user;
    } catch (error) {
      if (isApiError(error) && error.status === 401) logout();
      else setStatus("anonymous");
      return null;
    }
  }, [logout]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshUser(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  const login = useCallback(async (phone: string, code: string) => {
    const result = await loginWithSms(phone, code);
    browserTokenStorage.set(result.data.access_token);
    setUser(result.data.user);
    setStatus("authenticated");
    return result.data.user;
  }, []);

  const value = useMemo(() => ({ status, user, login, logout, refreshUser }), [status, user, login, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return context;
}
