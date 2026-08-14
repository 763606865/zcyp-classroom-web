import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: ButtonVariant;
}

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  { variants: { variant: {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
    secondary: "border border-border bg-surface text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-danger text-white hover:opacity-90",
  } }, defaultVariants: { variant: "primary" } },
);

export function Button({ children, className, disabled, loading = false, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden className="mr-2 size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
