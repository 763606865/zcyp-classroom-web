"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { createUuid } from "@/lib/uuid";

interface ToastItem { id: string; title: string; description?: string; }
interface ToastApi { toast(input: Omit<ToastItem, "id">): void; }
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((input: Omit<ToastItem, "id">) => setItems((current) => [...current, { ...input, id: createUuid() }]), []);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}><ToastPrimitive.Provider swipeDirection="right">
    {children}
    {items.map((item) => <ToastPrimitive.Root key={item.id} defaultOpen duration={4000} onOpenChange={(open) => { if (!open) setItems((current) => current.filter(({ id }) => id !== item.id)); }} className="grid grid-cols-[1fr_auto] gap-x-4 rounded-card border border-border bg-surface p-4 shadow-lg">
      <ToastPrimitive.Title className="text-sm font-semibold">{item.title}</ToastPrimitive.Title>
      {item.description ? <ToastPrimitive.Description className="mt-1 text-sm text-muted-foreground">{item.description}</ToastPrimitive.Description> : null}
      <ToastPrimitive.Close aria-label="关闭通知" className="row-span-2 p-1 text-muted-foreground"><X className="size-4" /></ToastPrimitive.Close>
    </ToastPrimitive.Root>)}
    <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4" />
  </ToastPrimitive.Provider></ToastContext.Provider>;
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast 必须在 ToastProvider 内使用");
  return context;
}
