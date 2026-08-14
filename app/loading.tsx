import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center" aria-busy="true">
      <div className="text-center text-muted-foreground">
        <Spinner className="text-primary" />
        <p className="mt-3 text-sm">正在加载页面…</p>
      </div>
    </main>
  );
}
