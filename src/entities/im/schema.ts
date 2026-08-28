import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const imProtocolSchema = z.object({
  auth_event: z.string().optional(),
  join_event: z.string().optional(),
  heartbeat_event: z.string().optional(),
  heartbeat_interval: z.number().optional(),
  send_event: z.string().optional(),
}).passthrough();

export const imConfigSchema = z.object({
  enabled: z.boolean().optional(),
  retryable: z.boolean().optional(),
  token: z.string().nullable().optional(),
  im_token: z.string().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  external_user_id: z.string().optional(),
  expires_at: nullableString,
  expires_in: z.number().optional(),
  ws_end_point: z.string().optional(),
  ws_url: z.string().optional(),
  websocket_url: z.string().optional(),
  protocol: imProtocolSchema.optional(),
  auth_event: z.string().optional(),
  join_event: z.string().optional(),
  heartbeat_event: z.string().optional(),
  heartbeat_interval: z.number().optional(),
  send_event: z.string().optional(),
}).passthrough();

export const imChatMessageSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  conversation_id: z.string().optional(),
  conversation_no: z.string().optional(),
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

export const imConversationSchema = z.object({
  conversation_no: z.string().optional(),
  key: z.string().optional(),
  type: z.string().optional(),
  course_id: z.number().optional(),
  class_id: z.number().optional(),
  title: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  conversation_id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export const imChatroomSchema = imConfigSchema.extend({
  conversation_id: z.union([z.string(), z.number()]).optional(),
  conversation_no: z.string().optional(),
  conversation: imConversationSchema.optional(),
  title: z.string().optional(),
  messages: z.array(imChatMessageSchema).optional(),
});

export type ImConfig = z.infer<typeof imConfigSchema>;
export type ImChatMessage = z.infer<typeof imChatMessageSchema>;
export type ImChatroom = z.infer<typeof imChatroomSchema>;
export type ImConversation = z.infer<typeof imConversationSchema>;
