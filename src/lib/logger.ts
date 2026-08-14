export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

const priorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const sensitiveKeys = /authorization|cookie|password|secret|token/i;

function configuredLevel(): LogLevel | "silent" {
  const value = process.env.LOG_LEVEL;

  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error" ||
    value === "silent"
  ) {
    return value;
  }

  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(process.env.NODE_ENV === "development" ? { stack: value.stack } : {}),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitiveKeys.test(key) ? "[REDACTED]" : sanitize(item, seen),
      ]),
    );
  }

  return value;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const minimumLevel = configuredLevel();
  if (minimumLevel === "silent" || priorities[level] < priorities[minimumLevel]) {
    return;
  }

  const entry = sanitize({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });

  const method = level === "debug" ? "debug" : level;
  console[method](JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
