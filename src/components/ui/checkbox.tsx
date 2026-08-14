"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Checkbox({ className, ...props }: CheckboxPrimitive.CheckboxProps) {
  return <CheckboxPrimitive.Root className={cn("peer size-4 shrink-0 rounded border border-border bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className)} {...props}>
    <CheckboxPrimitive.Indicator><Check className="size-3.5" /></CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>;
}
