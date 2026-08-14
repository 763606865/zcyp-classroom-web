import { Card } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ApiConnectivityCard } from "@/features/api-connectivity/api-connectivity-card";
import { AuthEntry } from "@/features/auth";

const foundations = [
  "类型安全的环境变量",
  "统一 API 客户端与错误模型",
  "结构化、脱敏日志",
  "设计 tokens 与 UI primitives",
  "Loading / Error / Not Found 状态页",
  "pnpm 与统一质量检查脚本",
];

export default function HomePage() {
  return (
    <main className="flex flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4"><p className="text-sm font-medium text-primary">Next.js 基础模板</p><AuthEntry /></div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          {siteConfig.description}
        </p>

        <section className="mt-10" aria-label="后端接口状态">
          <ApiConnectivityCard />
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="已内置能力">
          {foundations.map((item) => (
            <Card key={item} className="flex items-center gap-3 p-4">
              <span aria-hidden className="size-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">{item}</span>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
