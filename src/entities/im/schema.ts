import { z } from "zod";

const nullableString = z.string().nullable().optional();
const conversationNoSchema = z.union([z.string(), z.number()]).transform((value) => String(value));

export const imProtocolSchema = z.object({
  auth_event: z.string().optional(),
  join_event: z.string().optional(),
  heartbeat_event: z.string().optional(),
  heartbeat_interval: z.coerce.number().optional(),
  send_event: z.string().optional(),
}).passthrough();

export const imConfigSchema = z.object({
  enabled: z.boolean().optional(),
  retryable: z.boolean().optional(),
  token: z.union([z.string(), z.number()]).nullable().optional(),
  im_token: z.string().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  im_user_id: z.union([z.string(), z.number()]).optional(),
  external_user_id: z.union([z.string(), z.number()]).optional(),
  expires_at: nullableString,
  expires_in: z.coerce.number().optional(),
  ws_end_point: z.string().optional(),
  ws_url: z.string().optional(),
  websocket_url: z.string().optional(),
  http_url: z.string().optional(),
  api_url: z.string().optional(),
  im_end_point: z.string().optional(),
  end_point: z.string().optional(),
  http_end_point: z.string().optional(),
  protocol: imProtocolSchema.nullable().optional(),
  auth_event: z.string().optional(),
  join_event: z.string().optional(),
  heartbeat_event: z.string().optional(),
  heartbeat_interval: z.coerce.number().optional(),
  send_event: z.string().optional(),
}).passthrough();

export const imChatMessageSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  message_no: z.union([z.string(), z.number()]).optional(),
  conversation_no: conversationNoSchema.optional(),
  client_msg_id: z.union([z.string(), z.number()]).optional(),
  content: z.unknown().optional(),
  text: z.string().optional(),
  body: z.unknown().optional(),
  type: z.string().optional(),
  message_type: z.string().optional(),
  created_at: nullableString,
  sender_user_id: z.union([z.string(), z.number()]).optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  sender_id: z.union([z.string(), z.number()]).optional(),
  user: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    nick_name: z.string().optional(),
    real_name: z.string().optional(),
  }).passthrough().nullable().optional(),
  sender: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    nick_name: z.string().optional(),
  }).passthrough().nullable().optional(),
}).passthrough();

export const imConversationSchema = z.object({
  conversation_no: conversationNoSchema.optional(),
  key: z.string().optional(),
  type: z.string().optional(),
  course_id: z.coerce.number().optional(),
  class_id: z.coerce.number().optional(),
  title: z.string().optional(),
}).passthrough();

export const imChatroomSchema = imConfigSchema.extend({
  conversation_no: conversationNoSchema.optional(),
  conversation: imConversationSchema.nullable().optional(),
  title: z.string().optional(),
  messages: z.array(imChatMessageSchema).nullable().optional(),
}).passthrough();

export type ImConfig = z.infer<typeof imConfigSchema>;
export type ImChatMessage = z.infer<typeof imChatMessageSchema>;
export type ImChatroom = z.infer<typeof imChatroomSchema>;
export type ImConversation = z.infer<typeof imConversationSchema>;
