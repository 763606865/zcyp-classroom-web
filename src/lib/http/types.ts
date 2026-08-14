export type ClientType = "web" | "wechat-mini" | "app-ios" | "app-android";
export type ClientPlatform = "web" | "wechat" | "ios" | "android";

export interface ClientInfo {
  clientType: ClientType;
  appVersion: string;
  appBuild: string;
  platform: ClientPlatform;
  osVersion: string;
  deviceId: string;
  channel: string;
}

export interface ApiMeta {
  timestamp: number;
  response_time: number;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  code: number;
  data: T;
  meta: ApiMeta;
}

export type ApiFieldErrors = Record<string, string[]>;

export interface ApiFailure {
  code: number;
  message: string;
  errors?: ApiFieldErrors;
}

export interface ApiResult<T> {
  data: T;
  meta: ApiMeta;
  requestId: string;
  status: number;
}

export interface NextRequestOptions {
  revalidate?: number | false;
  tags?: string[];
}

export type ApiQueryValue = string | number | boolean | null | undefined;
export type ApiQuery = Record<string, ApiQueryValue | ApiQueryValue[]>;
export type ApiResponseType = "json" | "text" | "blob" | "void";

export interface ApiResponseSchema<T> {
  parse(value: unknown): T;
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "headers" | "signal"> {
  body?: BodyInit | Record<string, unknown> | null;
  clientInfo?: ClientInfo;
  headers?: HeadersInit;
  next?: NextRequestOptions;
  query?: ApiQuery;
  requestId?: string;
  responseSchema?: ApiResponseSchema<unknown>;
  responseType?: ApiResponseType;
  retry?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
  token?: string;
}
