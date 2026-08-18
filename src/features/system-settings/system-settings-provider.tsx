"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import type { SystemSettings } from "@/entities/system";
import { logger } from "@/lib/logger";
import { applyDocumentMeta } from "./apply-document-meta";
import { getSystemSettings } from "./api";
import { readCachedSystemSettings, writeCachedSystemSettings } from "./storage";

interface SystemSettingsContextValue {
  settings: SystemSettings | null;
  siteName: string;
  refresh(): Promise<SystemSettings | null>;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getSystemSettings();
      writeCachedSystemSettings(result.data);
      setSettings(result.data);
      applyDocumentMeta(result.data.site_name?.trim() || siteConfig.name, result.data.favicon);
      return result.data;
    } catch (error) {
      logger.warn("Failed to load system settings", { error });
      return readCachedSystemSettings();
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const cached = readCachedSystemSettings();
      if (cached) {
        setSettings(cached);
        applyDocumentMeta(cached.site_name?.trim() || siteConfig.name, cached.favicon);
      }
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const siteName = settings?.site_name?.trim() || siteConfig.name;
  const value = useMemo(() => ({ settings, siteName, refresh }), [refresh, settings, siteName]);

  return <SystemSettingsContext.Provider value={value}>{children}</SystemSettingsContext.Provider>;
}

export function useSystemSettings(): SystemSettingsContextValue {
  const context = useContext(SystemSettingsContext);
  if (!context) throw new Error("useSystemSettings 必须在 SystemSettingsProvider 内使用");
  return context;
}
