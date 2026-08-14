# Caiyun Next

基于 Next.js 16 App Router 的通用项目母版，用于派生后续 Web 项目。模板只内置跨项目稳定复用的工程能力，业务模块按需加入。

## 技术栈

- Next.js 16.2 / React 19 / TypeScript
- Tailwind CSS 4
- Zod 4、React Hook Form（运行时校验与表单）
- Radix UI primitives、Lucide icons
- ESLint 9
- pnpm 10

## 环境要求

- Node.js `>=20.9.0`
- pnpm `10.33.0`（推荐通过 Corepack 使用）

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

应用默认运行在 [http://localhost:3013](http://localhost:3013)。

## 环境变量

`.env` 不进入版本控制。所有变量及默认值见 `.env.example`。

| 变量 | 必填 | 作用 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | 是 | 后端 Host，不包含 `/api` 路径 |
| `NEXT_PUBLIC_APP_VERSION` | 否 | `X-App-Version`，默认 `0.1.0` |
| `NEXT_PUBLIC_APP_BUILD` | 否 | `X-App-Build`，默认 `1` |
| `NEXT_PUBLIC_APP_CHANNEL` | 否 | `X-Channel`，默认 `web` |
| `USE_MOCK_DATA` | 否 | 服务端 Mock 开关，默认 `false` |
| `LOG_LEVEL` | 否 | `debug/info/warn/error/silent` |

公开变量在 `src/config/env.ts` 模块加载时通过 Zod 校验。服务端变量只能通过 `getServerEnv()` 读取，避免意外打包到浏览器。

## API 客户端

统一入口为 `@/lib/http`。客户端自动携带后端要求的设备头，并为每次请求生成 UUID 格式的 `X-Request-ID`。

```tsx
"use client";

import { apiClient, isApiError } from "@/lib/http";

interface User {
  id: number;
  name: string;
}

async function loadCurrentUser() {
  try {
    const result = await apiClient.get<{ user: User }>("/api/user", {
      token: "sanctum-token",
    });

    return result.data.user;
  } catch (error) {
    if (isApiError(error)) {
      // 提交问题时一并提供 requestId。
      console.error(error.message, error.errors, error.requestId);
    }
    throw error;
  }
}
```

JSON 对象会自动序列化并设置 `Content-Type: application/json`。成功响应被解包为 `{data, meta, requestId, status}`，错误响应抛出 `ApiError`，字段校验信息位于 `error.errors`。

浏览器不会直接跨域访问后端，而是请求同源的 `/backend-api/*`，再由 Next.js rewrite 转发到 `NEXT_PUBLIC_API_URL/api/*`。这可以避免自定义开发域名、反向代理和生产域名分别配置 CORS。Server Component 等服务端调用仍直接访问后端 Host。

客户端还支持 Query 参数、请求取消、超时、幂等 GET 自动重试、Blob/Text/204 响应以及 Zod 响应校验：

```ts
const result = await apiClient.get("/api/articles", {
  query: { page: 1, keyword: "Next.js", tags: ["web", "featured"] },
  responseSchema: articlesSchema,
});
```

文件上传使用 `uploadFile(file, "image")`。用户资料、手机号修改和客户端版本校验分别由 `@/features/user` 与 `@/features/client-version` 提供。

## 登录与会话

`AuthProvider` 已在根布局安装。通过 `useAuth()` 可读取 `status`、`user`，以及调用 `login()`、`logout()` 和 `refreshUser()`。模板首页包含与后端协议一致的短信登录示例。

Bearer Token 默认由 `TokenStorage` 保存到 localStorage，请求层会自动添加 Authorization；接口返回 401 时自动清理会话。该存储实现可以替换。若后端未来支持 HttpOnly Cookie，生产项目优先改用 Cookie/BFF 会话，以降低 XSS 导致 Token 泄露的风险。

## 表单与 UI

- 表单使用 React Hook Form + Zod；`applyApiFieldErrors()` 将后端 422 `errors` 映射到字段。
- 基础组件位于 `src/components/ui`，包含 Button、Input、Textarea、Checkbox、Select、Dialog、Toast、Alert、FormField、Card、Spinner 与 EmptyState。
- 基础组件可从 `@/components/ui` 统一导入；组件内部仍使用相对文件，避免 barrel 循环依赖。
- 交互组件基于 Radix UI，统一使用 `globals.css` 中的设计 Token，并保留键盘和屏幕阅读器支持。

通用浏览器交互放在 `src/hooks`。例如短信、重试或跳转倒计时统一使用：

```tsx
const countdown = useCountdown();
countdown.start(60);
```

需要持久化少量浏览器状态时使用 `createBrowserStorage()`。它会处理 SSR、隐私模式及 localStorage 被禁用的情况，并自动降级到当前页面生命周期内的内存存储。

## 模块边界

- `components/ui`：无业务语义、无接口依赖的基础组件。
- `hooks`：跨业务复用的客户端状态与交互逻辑。
- `lib`：与 React 无关的基础设施和纯函数。
- `entities`：跨多个功能模块共享的领域类型及 Schema，例如 `User`。
- `features`：按业务能力纵向组织 API、状态、表单和业务组件。
- `app`：只负责路由组合、布局、SEO 和特殊状态页面。

同一个领域模型不要在多个 feature 中重复声明。接口响应 Schema 和 TypeScript 类型应从 `entities` 的同一份 Zod Schema 推导，避免后端字段变更时出现类型与运行时校验不一致。

浏览器端的 `X-Device-ID` 首次生成后保存在 localStorage。Server Component、Route Handler 或 Server Action 没有真实浏览器设备上下文，因此必须显式传入 `clientInfo`：

```ts
await apiClient.get("/api/example", {
  clientInfo: {
    clientType: "web",
    appVersion: "0.1.0",
    appBuild: "1",
    platform: "web",
    osVersion: "server",
    deviceId: requestDeviceId,
    channel: "web",
  },
});
```

设备同步接口可直接调用：

```ts
await apiClient.post("/api/devices/sync");
```

## 目录结构

```text
app/                    # 路由、布局和 Next.js 特殊状态页面
src/
├── components/ui/      # 无业务含义的基础 UI primitives
├── config/             # 环境变量、站点配置
├── entities/           # 跨 feature 共享的领域模型与 Schema
├── features/           # auth、user、files 等纵向功能模块
├── hooks/              # 通用客户端 Hooks
└── lib/
    ├── http/           # API 客户端、协议类型、错误模型
    ├── forms/          # 表单与 API 错误桥接
    ├── storage/        # SSR 安全的浏览器存储适配器
    ├── logger.ts       # 结构化日志与敏感字段脱敏
    └── utils/          # 通用纯函数
public/                 # 静态资源
```

业务能力应放入 `src/features/<feature-name>`，避免把业务组件堆入 `components/ui`。

## 脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 运行生产构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | 自动修复可修复的 ESLint 问题 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm check` | 依次运行 lint、typecheck、build |

## 开发约定

- 业务代码不要直接读取 `process.env`，统一通过 `src/config/env.ts`。
- 后端请求统一使用 `src/lib/http`，不要在页面中散落 Header 和响应解包逻辑。
- 不记录 Authorization、Cookie、Token、密码、请求体或响应内容。
- 预期内的业务失败使用 `ApiError`；未捕获异常交给 `error.tsx`。
- 提交代码前运行 `pnpm check`。
