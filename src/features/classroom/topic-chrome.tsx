import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function TopicHero({
  title,
  subtitle,
  stats,
  aside,
}: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string; unit: string }[];
  aside?: ReactNode;
}) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{subtitle}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-xl bg-white px-3 py-4 text-foreground">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-semibold text-primary sm:text-2xl">
                  {item.value}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        {aside}
      </div>
    </section>
  );
}

export function TopicSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <h2 className="border-l-4 border-primary pl-3 text-xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function TopicChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
