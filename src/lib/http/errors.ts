import type { ApiFieldErrors } from "./types";

export interface ApiErrorOptions {
  status: number;
  code?: number;
  errors?: ApiFieldErrors;
  requestId?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: number;
  readonly errors?: ApiFieldErrors;
  readonly requestId?: string;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code ?? options.status;
    this.errors = options.errors;
    this.requestId = options.requestId;
  }
}

export class ApiNetworkError extends ApiError {
  constructor(message: string, options: Omit<ApiErrorOptions, "status"> = {}) {
    super(message, { ...options, status: 0 });
    this.name = "ApiNetworkError";
  }
}

export class ApiTimeoutError extends ApiNetworkError {
  constructor(requestId: string, cause?: unknown) {
    super("请求超时，请稍后重试", { requestId, cause });
    this.name = "ApiTimeoutError";
  }
}

export class ApiValidationError extends ApiError {
  constructor(requestId: string, cause?: unknown) {
    super("API 响应数据校验失败", { status: 502, requestId, cause });
    this.name = "ApiValidationError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
