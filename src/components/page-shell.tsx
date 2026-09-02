import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:py-8">{children}</div>;
}
