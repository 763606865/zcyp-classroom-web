import type { ImChatMessage, ImChatroom, ImConfig } from "@/entities/im";
import { imChatroomSchema, imConfigSchema } from "@/entities/im";
import { apiClient } from "@/lib/http";
import { logger } from "@/lib/logger";

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

export function normalizeChatMessage(raw: ImChatMessage | Record<string, unknown>, conversationId: string): ChatMessage | null {
  const record = raw as ImChatMessage;
  const nested = asRecord(record.body) ?? asRecord((record as Record<string, unknown>).payload);
  const content = pickString(record.content, record.text, record.body, nested?.content, nested?.text);
  if (!content) return null;
  const user = record.user ?? record.sender;
  return {
    id: pickString(record.id, `${Date.now()}-${content.slice(0, 8)}`),
    conversationId: pickString(record.conversation_no, record.conversation_id, conversationId),
    content,
    userId: pickString(record.user_id, record.sender_id, user?.id) || undefined,
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

function resolveWsUrl(config: ImConfig) {
  return pickString(config.ws_end_point, config.ws_url, config.websocket_url);
}

function resolveToken(config: ImConfig) {
  return pickString(config.token, config.im_token);
}

class ImClient {
  private socket?: WebSocket;
  private config?: ImConfig;
  private heartbeat?: number;
  private reconnectTimer?: number;
  private conversations = new Set<string>();
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
    if (!resolveWsUrl(this.config) || !resolveToken(this.config)) {
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
    const conversationId = pickString(
      room.conversation?.conversation_no,
      room.conversation_no,
      room.conversation_id,
      room.conversation?.conversation_id,
      room.conversation?.id,
    );
    if (!conversationId) throw new Error("聊天室未返回会话号");
    this.conversations.add(conversationId);
    const history = (room.messages ?? []).map((item) => normalizeChatMessage(item, conversationId)).filter((item): item is ChatMessage => Boolean(item));
    if (history.length) {
      this.messages.set(conversationId, history);
      this.emit();
    }
    this.start({ ...this.config, ...room, enabled: true });
    this.join(conversationId);
    return {
      conversationId,
      title: pickString(room.conversation?.title, room.title, "班级群聊"),
      classId: room.conversation?.class_id,
    };
  }

  sendText(conversationId: string, content: string) {
    const event = this.config?.send_event || "message.send";
    this.send(event, {
      conversation_no: conversationId,
      conversation_id: conversationId,
      type: "text",
      content,
      client_msg_id: `${Date.now()}`,
    });
    const mine: ChatMessage = {
      id: `local-${Date.now()}`,
      conversationId,
      content,
      userId: pickString(this.config?.user_id) || undefined,
      userName: "我",
      createdAt: new Date().toISOString(),
    };
    this.push(mine);
  }

  getMessages(conversationId: string) {
    return this.messages.get(conversationId) ?? [];
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  stop() {
    this.stopped = true;
    this.conversations.clear();
    this.messages.clear();
    this.clearTimers();
    this.socket?.close();
    this.socket = undefined;
    this.config = undefined;
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
      this.messages.set(message.conversationId, [...list.slice(0, -1), { ...last, ...message, id: message.id.startsWith("local-") ? last.id : message.id }]);
      this.emit();
      return;
    }
    this.messages.set(message.conversationId, [...list, message]);
    this.emit();
  }

  private connect() {
    if (this.stopped || this.connecting || !this.config) return;
    const url = resolveWsUrl(this.config);
    if (!url) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    this.connecting = true;
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      this.connecting = false;
      this.retries = 0;
      this.authenticate();
      this.conversations.forEach((id) => this.join(id));
      this.startHeartbeat();
    };
    socket.onmessage = (event) => this.handleMessage(String(event.data));
    socket.onerror = () => logger.warn("IM WebSocket 出错");
    socket.onclose = () => {
      this.connecting = false;
      this.clearTimers();
      if (!this.stopped) this.scheduleReconnect();
    };
  }

  private authenticate() {
    if (!this.config) return;
    this.send(this.config.auth_event || "auth", {
      token: resolveToken(this.config),
      user_id: pickString(this.config.user_id),
    });
  }

  private join(conversationId: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.send(this.config?.join_event || "conversation.join", { conversation_no: conversationId });
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    const interval = this.config?.heartbeat_interval ?? 25_000;
    this.heartbeat = window.setInterval(() => {
      this.send(this.config?.heartbeat_event || "ping", { timestamp: Date.now() });
    }, interval);
  }

  private send(event: string, data: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ event, data }));
  }

  private handleMessage(raw: string) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return; }
    const frames = Array.isArray(parsed) ? parsed : [parsed];
    for (const frame of frames) {
      const record = asRecord(frame);
      if (!record) continue;
      const event = pickString(record.event, record.type, record.name);
      const data = asRecord(record.data) ?? asRecord(record.payload) ?? record;
      if (event.includes("message") && event !== this.config?.send_event) {
        const conversationId = pickString(data.conversation_no, data.conversation_id, [...this.conversations][0]);
        const message = normalizeChatMessage(data as ImChatMessage, conversationId);
        if (message) this.push(message);
      }
    }
  }

  private scheduleReconnect() {
    this.clearReconnect();
    const delay = Math.min(1000 * 2 ** this.retries, 15_000);
    this.retries += 1;
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }

  private clearHeartbeat() {
    if (this.heartbeat) window.clearInterval(this.heartbeat);
    this.heartbeat = undefined;
  }

  private clearReconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private clearTimers() {
    this.clearHeartbeat();
    this.clearReconnect();
  }
}

export const imClient = new ImClient();

if (typeof window !== "undefined") {
  window.addEventListener("online", () => imClient.start());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") imClient.start();
  });
}
