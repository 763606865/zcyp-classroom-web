"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { imClient } from "@/lib/im-client";
import { configureHttpAuth, isApiError } from "@/lib/http";
import { exchangeEcosystemTicket, getCurrentUser, loginWithSms } from "./api";
import type { ImConfig } from "@/entities/im";
import { browserTokenStorage } from "./token-storage";
import type { AuthStatus, User } from "./types";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login(phone: string, code: string): Promise<User>;
  loginWithEcosystemTicket(ticket: string): Promise<User>;
  logout(): void;
  refreshUser(): Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    imClient.stop();
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
      if (result.data.im) imClient.start(result.data.im);
      else void imClient.retry(undefined, token).catch(() => undefined);
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

  const applySession = useCallback((accessToken: string, nextUser: User, im?: ImConfig) => {
    browserTokenStorage.set(accessToken);
    setUser(nextUser);
    setStatus("authenticated");
    if (im?.enabled) imClient.start(im);
    else if (im?.retryable) void imClient.retry(undefined, accessToken).catch(() => undefined);
    return nextUser;
  }, []);

  const login = useCallback(async (phone: string, code: string) => {
    const result = await loginWithSms(phone, code);
    return applySession(result.data.access_token, result.data.user, result.data.im);
  }, [applySession]);

  const loginWithEcosystemTicket = useCallback(async (ticket: string) => {
    const result = await exchangeEcosystemTicket(ticket);
    return applySession(result.data.access_token, result.data.user, result.data.im);
  }, [applySession]);

  const value = useMemo(
    () => ({ status, user, login, loginWithEcosystemTicket, logout, refreshUser }),
    [status, user, login, loginWithEcosystemTicket, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return context;
}
