import type { ReactNode } from "react";
import { Label } from "./label";

export function FormField({ id, label, description, error, children }: { id: string; label: string; description?: string; error?: string; children: ReactNode }) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {description ? <p id={descriptionId} className="text-xs text-muted-foreground">{description}</p> : null}
    {error ? <p id={errorId} role="alert" className="text-xs text-danger">{error}</p> : null}
  </div>;
}
