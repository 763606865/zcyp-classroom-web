import { publicEnv } from "@/config/env";
import { logger } from "@/lib/logger";
import { createUuid } from "@/lib/uuid";
import { getHttpAuthAdapter } from "./auth";
import { createClientHeaders, getWebClientInfo } from "./client-info";
import { ApiError, ApiNetworkError, ApiTimeoutError, ApiValidationError } from "./errors";
import type { ApiFailure, ApiRequestOptions, ApiResult, ApiSuccess } from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;
const BROWSER_API_PROXY_PATH = "/backend-api";

function resolveUrl(path: string, query?: ApiRequestOptions["query"]): string {
  if (!path.startsWith("/api/")) throw new Error(`API 路径必须以 /api/ 开头，收到：${path}`);
  const url = typeof window === "undefined"
    ? new URL(path, `${publicEnv.NEXT_PUBLIC_API_URL}/`)
    : new URL(path.replace(/^\/api/, BROWSER_API_PROXY_PATH), window.location.origin);
  if (query) {
    for (const [key, rawValue] of Object.entries(query)) {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of values) {
        if (value !== null && value !== undefined) url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

function isJsonBody(body: ApiRequestOptions["body"]): body is Record<string, unknown> {
  return Boolean(body && typeof body === "object" && !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) && !(body instanceof Blob) && !(body instanceof ArrayBuffer));
}

async function parseJson(response: Response): Promise<unknown> {
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return undefined;
  try { return await response.json(); } catch { return undefined; }
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.code === "number" && typeof record.message === "string";
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.code === "number" && "data" in record &&
    Boolean(record.meta) && typeof record.meta === "object";
}

function isRetryable(error: unknown): boolean {
  return error instanceof ApiNetworkError ||
    (error instanceof ApiError && (error.status === 429 || error.status >= 500));
}

function retryDelay(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.min(250 * 2 ** attempt, 2_000)));
}

async function requestOnce<T>(path: `/api/${string}`, options: ApiRequestOptions): Promise<ApiResult<T>> {
  const requestId = options.requestId ?? createUuid();
  const clientInfo = options.clientInfo ?? getWebClientInfo();
  const headers = new Headers(options.headers);
  const body = isJsonBody(options.body) ? JSON.stringify(options.body) : options.body;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  for (const [key, value] of Object.entries(createClientHeaders(clientInfo, requestId))) headers.set(key, value);
  headers.set("Accept", "application/json");
  if (isJsonBody(options.body)) headers.set("Content-Type", "application/json");
  const token = options.token ?? getHttpAuthAdapter()?.getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", forwardAbort, { once: true });

  const { clientInfo: _clientInfo, requestId: _requestId, timeoutMs: _timeoutMs,
    token: _token, next, query: _query, responseSchema: _responseSchema,
    responseType: _responseType, retry: _retry, ...requestInit } = options;
  void _clientInfo; void _requestId; void _timeoutMs; void _token;
  void _query; void _responseSchema; void _responseType; void _retry;

  logger.debug("API request started", { method: options.method ?? "GET", path, requestId });
  try {
    const response = await fetch(resolveUrl(path, options.query), {
      ...requestInit, body: body ?? undefined, headers, signal: controller.signal,
      ...(next ? { next } : {}),
    });
    const responseRequestId = response.headers.get("X-Request-ID") ?? requestId;
    const responseType = options.responseType ?? "json";
    const payload = responseType === "blob" ? await response.blob()
      : responseType === "text" ? await response.text()
      : responseType === "void" || response.status === 204 ? undefined
      : await parseJson(response);

    if (!response.ok || isApiFailure(payload)) {
      if (response.status === 401) getHttpAuthAdapter()?.onUnauthorized?.();
      const failure = isApiFailure(payload) ? payload : undefined;
      throw new ApiError(failure?.message ?? `API 请求失败（${response.status}）`, {
        status: response.status, code: failure?.code, errors: failure?.errors,
        requestId: responseRequestId,
      });
    }

    if (responseType !== "json" || response.status === 204) {
      return { data: payload as T, meta: { timestamp: Date.now() / 1000, response_time: 0 },
        requestId: responseRequestId, status: response.status };
    }
    if (!isApiSuccess<unknown>(payload)) {
      throw new ApiError("API 响应格式不符合约定", { status: response.status, requestId: responseRequestId });
    }

    let data: T;
    try {
      data = options.responseSchema ? options.responseSchema.parse(payload.data) as T : payload.data as T;
    } catch (error) {
      throw new ApiValidationError(responseRequestId, error);
    }

    logger.info("API request completed", { method: options.method ?? "GET", path,
      requestId: responseRequestId, status: response.status, responseTime: payload.meta.response_time });
    return { data, meta: payload.meta, requestId: responseRequestId, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn("API request failed", { method: options.method ?? "GET", path,
        requestId: error.requestId ?? requestId, status: error.status, error });
      throw error;
    }
    if (controller.signal.aborted && !options.signal?.aborted) throw new ApiTimeoutError(requestId, error);
    throw new ApiNetworkError("无法连接到服务器，请检查网络后重试", { requestId, cause: error });
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}

export async function apiRequest<T>(path: `/api/${string}`, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  let attempt = 0;
  while (true) {
    try { return await requestOnce<T>(path, options); }
    catch (error) {
      if (attempt >= (options.retry ?? 0) || !isRetryable(error)) throw error;
      await retryDelay(attempt++);
    }
  }
}

export const apiClient = {
  get: <T>(path: `/api/${string}`, options?: ApiRequestOptions) => apiRequest<T>(path, { retry: 1, ...options, method: "GET" }),
  post: <T>(path: `/api/${string}`, body?: ApiRequestOptions["body"], options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, body, method: "POST" }),
  put: <T>(path: `/api/${string}`, body?: ApiRequestOptions["body"], options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, body, method: "PUT" }),
  patch: <T>(path: `/api/${string}`, body?: ApiRequestOptions["body"], options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, body, method: "PATCH" }),
  delete: <T>(path: `/api/${string}`, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
