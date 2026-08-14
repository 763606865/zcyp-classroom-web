import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().transform((value) => value.replace(/\/$/, "")),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1).default("0.1.0"),
  NEXT_PUBLIC_APP_BUILD: z.string().min(1).default("1"),
  NEXT_PUBLIC_APP_CHANNEL: z.string().min(1).default("web"),
});

const serverEnvSchema = z.object({
  USE_MOCK_DATA: booleanFromString,
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "silent"])
    .default("info"),
});

function formatEnvError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");
}

function parseEnv<T>(schema: z.ZodType<T>, values: unknown, scope: string): T {
  const result = schema.safeParse(values);

  if (!result.success) {
    throw new Error(`${scope}环境变量配置无效：${formatEnvError(result.error)}`);
  }

  return result.data;
}

// NEXT_PUBLIC_* 必须使用静态属性访问，Next.js 才能在客户端构建时正确内联。
export const publicEnv = parseEnv(
  publicEnvSchema,
  {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_APP_BUILD: process.env.NEXT_PUBLIC_APP_BUILD,
    NEXT_PUBLIC_APP_CHANNEL: process.env.NEXT_PUBLIC_APP_CHANNEL,
  },
  "公开",
);

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("服务端环境变量不能在浏览器中读取");
  }

  return parseEnv(
    serverEnvSchema,
    {
      USE_MOCK_DATA: process.env.USE_MOCK_DATA,
      LOG_LEVEL: process.env.LOG_LEVEL,
    },
    "服务端",
  );
}

export type ServerEnv = z.infer<typeof serverEnvSchema>;
