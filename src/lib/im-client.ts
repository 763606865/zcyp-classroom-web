import type { ImChatMessage, ImChatroom, ImConfig } from "@/entities/im";
import { imChatroomSchema, imConfigSchema } from "@/entities/im";
import { publicEnv } from "@/config/env";
import { apiClient } from "@/lib/http";
import { logger } from "@/lib/logger";
import { createUuid } from "@/lib/uuid";

const HISTORY_LIMIT = 20;

export type ChatMessage = {
  id: string;
  conversationId: string;
  content: string;
  userId?: string;
  userName: string;
  createdAt?: string;
};

type Listener = (messages: ChatMessage[]) => void;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

export function normalizeChatMessage(raw: ImChatMessage | Record<string, unknown>, conversationNo: string): ChatMessage | null {
  const record = raw as ImChatMessage & Record<string, unknown>;
  const nested = asRecord(record.body) ?? asRecord(record.payload) ?? asRecord(record.content);
  const content = pickString(
    typeof record.content === "string" ? record.content : undefined,
    record.text,
    nested?.text,
    nested?.content,
    typeof record.body === "string" ? record.body : undefined,
  );
  if (!content) return null;
  const user = record.user ?? record.sender;
  return {
    id: pickString(record.message_no, record.id, record.client_msg_id, `${Date.now()}-${content.slice(0, 8)}`),
    conversationId: pickString(record.conversation_no, conversationNo),
    content,
    userId: pickString(record.sender_user_id, record.user_id, record.sender_id, user?.id) || undefined,
    userName: pickString(user?.nick_name, user?.real_name, user?.name, "学员") || "学员",
    createdAt: record.created_at ?? undefined,
  };
}

function flattenImConfig(config: ImConfig): ImConfig {
  const protocol = config.protocol;
  if (!protocol) return config;
  return {
    ...config,
    auth_event: config.auth_event ?? protocol.auth_event,
    join_event: config.join_event ?? protocol.join_event,
    heartbeat_event: config.heartbeat_event ?? protocol.heartbeat_event,
    heartbeat_interval: config.heartbeat_interval ?? protocol.heartbeat_interval,
    send_event: config.send_event ?? protocol.send_event,
  };
}

function resolveToken(config: ImConfig) {
  return pickString(config.token, config.im_token);
}

function resolveWsConnectUrl(config: ImConfig) {
  const raw = pickString(config.ws_end_point, config.ws_url, config.websocket_url);
  const token = resolveToken(config);
  if (!raw || !token) return "";
  try {
    const url = new URL(raw);
    if (url.protocol === "https:") url.protocol = "wss:";
    if (url.protocol === "http:") url.protocol = "ws:";
    if (!url.pathname || url.pathname === "/") url.pathname = "/im/connect";
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return "";
  }
}

function toImHttpBase(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol === "wss:") url.protocol = "https:";
    if (url.protocol === "ws:") url.protocol = "http:";
    url.pathname = url.pathname
      .replace(/\/im\/connect\/?$/i, "")
      .replace(/\/ws\/?$/i, "") || "/";
    url.search = "";
    url.hash = "";
    return `${url.origin}${url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "")}`;
  } catch {
    return raw.replace(/\/$/, "");
  }
}

function resolveHttpUrl(config?: ImConfig) {
  if (typeof window !== "undefined" && publicEnv.NEXT_PUBLIC_IM_API_URL) {
    return `${window.location.origin}/im-api`;
  }
  if (!config) return "";
  const explicit = pickString(
    config.http_url,
    config.api_url,
    config.im_end_point,
    config.http_end_point,
    config.end_point,
    publicEnv.NEXT_PUBLIC_IM_API_URL,
  );
  if (explicit) return toImHttpBase(explicit);
  const ws = pickString(config.ws_end_point, config.ws_url, config.websocket_url);
  return ws ? toImHttpBase(ws) : "";
}

function parseMessageList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.messages)) return record.messages;
  if (Array.isArray(record.items)) return record.items;
  const nested = asRecord(record.data);
  if (nested && Array.isArray(nested.data)) return nested.data;
  if (nested && Array.isArray(nested.messages)) return nested.messages;
  if (nested && Array.isArray(nested.items)) return nested.items;
  return [];
}

function sortMessages(items: ChatMessage[]) {
  return [...items].sort((a, b) => {
    const timeA = Date.parse(a.createdAt ?? "") || 0;
    const timeB = Date.parse(b.createdAt ?? "") || 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

async function imGet(path: string, config?: ImConfig) {
  const base = resolveHttpUrl(config);
  const token = config ? resolveToken(config) : "";
  if (!base) throw new Error("未配置 IM HTTP 地址");
  if (!token) throw new Error("缺少 IM Token");
  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload: unknown = (response.headers.get("content-type") ?? "").includes("application/json")
    ? await response.json().catch(() => undefined)
    : undefined;
  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(pickString(record?.error, record?.message, `IM 请求失败（${response.status}）`));
  }
  const record = asRecord(payload);
  return record?.data ?? payload;
}

class ImClient {
  private socket?: WebSocket;
  private config?: ImConfig;
  private reconnectTimer?: number;
  private conversations = new Set<string>();
  private subscribed = new Set<string>();
  private messages = new Map<string, ChatMessage[]>();
  private listeners = new Set<Listener>();
  private connecting = false;
  private stopped = true;
  private retries = 0;

  start(config?: ImConfig | null) {
    if (config?.enabled === false) return;
    if (config) this.config = flattenImConfig({ ...this.config, ...config });
    if (!this.config) return;
    this.stopped = false;
    if (!resolveWsConnectUrl(this.config)) {
      logger.warn("IM 配置缺少 ws 地址或 token，跳过连接");
      return;
    }
    this.connect();
  }

  async retry(_apiBaseUrl?: string, accessToken?: string) {
    const result = await apiClient.post<ImConfig>("/api/im/bootstrap", {}, {
      token: accessToken,
      responseSchema: imConfigSchema,
      retry: 0,
    });
    if (result.data.retryable && result.data.enabled === false) return result.data;
    this.start({ ...result.data, enabled: result.data.enabled !== false });
    return result.data;
  }

  async enterCourse(_apiBaseUrl: string | undefined, accessToken: string | undefined, courseId: number) {
    if (!this.config && !this.socket) {
      try { await this.retry(undefined, accessToken); } catch { /* 登录后 IM 不可用时学习页仍可打开 */ }
    }
    const result = await apiClient.post<ImChatroom>(`/api/me/courses/${courseId}/chatroom`, {}, {
      token: accessToken,
      responseSchema: imChatroomSchema,
      retry: 0,
    });
    const room = result.data;
    if (room.enabled === false) throw new Error("即时通讯未启用");
    const conversationNo = pickString(room.conversation?.conversation_no, room.conversation_no);
    if (!conversationNo) throw new Error("聊天室未返回会话号");
    this.conversations.add(conversationNo);
    this.start({ ...this.config, ...room, enabled: true });
    try {
      await this.waitForSocket();
      await this.waitForSubscribed(conversationNo);
    } catch (error) {
      logger.warn("IM WebSocket 订阅失败", { error });
    }
    try {
      await this.loadHistory(conversationNo);
    } catch (error) {
      logger.warn("IM 历史消息加载失败", { error });
    }
    return {
      conversationId: conversationNo,
      title: pickString(room.conversation?.title, room.title, "班级群聊"),
      classId: room.conversation?.class_id,
    };
  }

  async sendText(conversationNo: string, content: string) {
    await this.waitForSocket();
    await this.waitForSubscribed(conversationNo);
    const clientMsgId = createUuid();
    const sent = this.sendFrame({
      action: "send_message",
      conversation_no: conversationNo,
      message_type: "text",
      client_msg_id: clientMsgId,
      content: { text: content },
    });
    if (!sent) throw new Error("IM 连接未就绪，消息未发送");
    this.push({
      id: `local-${clientMsgId}`,
      conversationId: conversationNo,
      content,
      userId: pickString(this.config?.user_id, this.config?.external_user_id) || undefined,
      userName: "我",
      createdAt: new Date().toISOString(),
    });
  }

  getMessages(conversationNo: string) {
    return this.messages.get(conversationNo) ?? [];
  }

  currentUserIds() {
    return [
      pickString(this.config?.user_id),
      pickString(this.config?.im_user_id),
      pickString(this.config?.external_user_id),
    ].filter(Boolean);
  }

  isOwnMessage(message: ChatMessage, extraIds: Array<string | number | null | undefined> = []) {
    if (message.userName === "我") return true;
    if (!message.userId) return false;
    const ids = new Set(
      [...this.currentUserIds(), ...extraIds.map((id) => pickString(id))].filter(Boolean),
    );
    return ids.has(String(message.userId));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  stop() {
    this.stopped = true;
    this.conversations.clear();
    this.subscribed.clear();
    this.messages.clear();
    this.clearReconnect();
    this.socket?.close();
    this.socket = undefined;
    this.config = undefined;
    this.emit();
  }

  private async loadHistory(conversationNo: string) {
    const payload = await imGet(
      `/im/conversations/${encodeURIComponent(conversationNo)}/messages?limit=${HISTORY_LIMIT}`,
      this.config,
    );
    const history = sortMessages(
      parseMessageList(payload)
        .map((item) => normalizeChatMessage(item as ImChatMessage, conversationNo))
        .filter((item): item is ChatMessage => Boolean(item)),
    ).slice(-HISTORY_LIMIT);
    const current = this.messages.get(conversationNo) ?? [];
    const locals = current.filter((item) => item.id.startsWith("local-"));
    this.messages.set(conversationNo, [...history, ...locals]);
    this.emit();
  }

  private snapshot() {
    return [...this.messages.values()].flat();
  }

  private emit() {
    const all = this.snapshot();
    this.listeners.forEach((listener) => listener(all));
  }

  private push(message: ChatMessage) {
    const list = this.messages.get(message.conversationId) ?? [];
    if (list.some((item) => item.id === message.id && item.id !== "" && !item.id.startsWith("local-"))) return;
    const last = list.at(-1);
    if (last && last.content === message.content && last.conversationId === message.conversationId
      && (last.id.startsWith("local-") || message.id.startsWith("local-"))) {
      this.messages.set(message.conversationId, [...list.slice(0, -1), {
        ...last,
        ...message,
        id: message.id.startsWith("local-") ? last.id : message.id,
      }]);
      this.emit();
      return;
    }
    this.messages.set(message.conversationId, [...list, message]);
    this.emit();
  }

  private connect() {
    if (this.stopped || this.connecting || !this.config) return;
    const url = resolveWsConnectUrl(this.config);
    if (!url) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    this.connecting = true;
    logger.info("IM WebSocket 连接", { url: url.replace(/([?&]token=)[^&]+/i, "$1***") });
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      this.connecting = false;
      this.retries = 0;
      this.conversations.forEach((conversationNo) => this.subscribeConversation(conversationNo));
    };
    socket.onmessage = (event) => this.handleMessage(String(event.data));
    socket.onerror = () => logger.warn("IM WebSocket 出错");
    socket.onclose = () => {
      this.connecting = false;
      this.subscribed.clear();
      if (!this.stopped) this.scheduleReconnect();
    };
  }

  private subscribeConversation(conversationNo: string) {
    this.sendFrame({ action: "subscribe", conversation_no: conversationNo });
  }

  private sendFrame(frame: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    logger.info("IM WebSocket 发送", {
      action: frame.action,
      conversation_no: frame.conversation_no,
      message_type: frame.message_type,
    });
    this.socket.send(JSON.stringify(frame));
    return true;
  }

  private waitForSocket(timeoutMs = 8000) {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    this.connect();
    return new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          window.clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - started > timeoutMs) {
          window.clearInterval(timer);
          reject(new Error("IM 连接未就绪"));
        }
      }, 80);
    });
  }

  private waitForSubscribed(conversationNo: string, timeoutMs = 8000) {
    if (this.subscribed.has(conversationNo)) return Promise.resolve();
    this.subscribeConversation(conversationNo);
    return new Promise<void>((resolve, reject) => {
      const started = Date.now();
      let lastAttempt = 0;
      const timer = window.setInterval(() => {
        if (this.subscribed.has(conversationNo)) {
          window.clearInterval(timer);
          resolve();
          return;
        }
        if (this.socket?.readyState === WebSocket.OPEN && Date.now() - lastAttempt > 1000) {
          lastAttempt = Date.now();
          this.subscribeConversation(conversationNo);
        }
        if (Date.now() - started > timeoutMs) {
          window.clearInterval(timer);
          reject(new Error("IM 会话订阅超时"));
        }
      }, 80);
    });
  }

  private handleMessage(raw: string) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return; }
    const frames = Array.isArray(parsed) ? parsed : [parsed];
    for (const frame of frames) {
      const record = asRecord(frame);
      if (!record) continue;
      const action = pickString(record.action, record.event, record.type);
      if (action === "subscribed" || action === "subscribe") {
        const conversationNo = pickString(record.conversation_no);
        if (conversationNo) this.subscribed.add(conversationNo);
        continue;
      }
      if (action === "conversation_changed") {
        const conversationNo = pickString(record.conversation_no);
        if (conversationNo && this.conversations.has(conversationNo)) {
          this.subscribeConversation(conversationNo);
          void this.loadHistory(conversationNo).catch((error) => {
            logger.warn("IM 历史消息加载失败", { error });
          });
        }
        continue;
      }
      if (action === "error") {
        logger.warn("IM 返回错误", { error: pickString(record.error, record.message) });
        continue;
      }
      if (action !== "message" && action !== "send_message") continue;
      const nestedMessage = asRecord(record.message) ?? asRecord(record.data) ?? record;
      const conversationNo = pickString(
        record.conversation_no,
        nestedMessage.conversation_no,
        [...this.conversations][0],
      );
      const message = normalizeChatMessage(nestedMessage as ImChatMessage, conversationNo);
      if (message) this.push(message);
    }
  }

  private scheduleReconnect() {
    this.clearReconnect();
    const delay = Math.min(1000 * 2 ** this.retries, 15_000);
    this.retries += 1;
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }
}

export const imClient = new ImClient();

if (typeof window !== "undefined") {
  window.addEventListener("online", () => imClient.start());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") imClient.start();
  });
}
