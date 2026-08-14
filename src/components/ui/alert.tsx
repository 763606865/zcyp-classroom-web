import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn("rounded-md border border-border bg-muted px-4 py-3 text-sm", className)} {...props} />;
}
