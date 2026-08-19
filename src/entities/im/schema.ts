import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const imConfigSchema = z.object({
  enabled: z.boolean().optional(),
  retryable: z.boolean().optional(),
  token: z.string().optional(),
  im_token: z.string().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  ws_end_point: z.string().optional(),
  ws_url: z.string().optional(),
  websocket_url: z.string().optional(),
  auth_event: z.string().optional(),
  join_event: z.string().optional(),
  heartbeat_event: z.string().optional(),
  heartbeat_interval: z.number().optional(),
  send_event: z.string().optional(),
}).passthrough();

export const imChatMessageSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  conversation_id: z.string().optional(),
  content: z.string().optional(),
  text: z.string().optional(),
  body: z.string().optional(),
  type: z.string().optional(),
  created_at: nullableString,
  user_id: z.union([z.string(), z.number()]).optional(),
  sender_id: z.union([z.string(), z.number()]).optional(),
  user: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    nick_name: z.string().optional(),
    real_name: z.string().optional(),
  }).passthrough().optional(),
  sender: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    nick_name: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

export const imChatroomSchema = z.object({
  conversation_id: z.union([z.string(), z.number()]).optional(),
  conversation: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    conversation_id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
  }).passthrough().optional(),
  title: z.string().optional(),
  messages: z.array(imChatMessageSchema).optional(),
  enabled: z.boolean().optional(),
  retryable: z.boolean().optional(),
  token: z.string().optional(),
  im_token: z.string().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  ws_end_point: z.string().optional(),
  ws_url: z.string().optional(),
  websocket_url: z.string().optional(),
  auth_event: z.string().optional(),
  join_event: z.string().optional(),
  heartbeat_event: z.string().optional(),
  heartbeat_interval: z.number().optional(),
  send_event: z.string().optional(),
}).passthrough();

export type ImConfig = z.infer<typeof imConfigSchema>;
export type ImChatMessage = z.infer<typeof imChatMessageSchema>;
export type ImChatroom = z.infer<typeof imChatroomSchema>;
