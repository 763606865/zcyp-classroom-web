import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center px-6 py-16">
      <EmptyState
        title="页面不存在"
        description="你访问的页面可能已被移动、删除，或地址输入有误。"
        action={
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            返回首页
          </Link>
        }
      />
    </main>
  );
}
