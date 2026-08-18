"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/auth-provider";
import { SystemSettingsProvider } from "@/features/system-settings/system-settings-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SystemSettingsProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </SystemSettingsProvider>
  );
}
