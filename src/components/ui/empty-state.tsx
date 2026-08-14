import type { ReactNode } from "react";
import { Card } from "./card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <div aria-hidden className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-xl">
        ◇
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}
