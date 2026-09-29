"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { ChatEmojiPicker } from "./chat-emoji-picker";
import { getApiErrorMessage } from "@/lib/forms";
import { imClient, type ChatMessage } from "@/lib/im-client";
import { browserTokenStorage } from "@/features/auth/token-storage";

export function CourseChat({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    let roomId = "";
    const token = browserTokenStorage.get() ?? undefined;
    void imClient.enterCourse(undefined, token, courseId)
      .then((room) => {
        if (cancelled) return;
        roomId = room.conversationId;
        setConversationId(room.conversationId);
        setReady(true);
        setError(undefined);
        setMessages(imClient.getMessages(room.conversationId));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "暂无法进入班级群聊"));
      });
    const unsubscribe = imClient.subscribe((all) => {
      if (cancelled || !roomId) return;
      setMessages(all.filter((item) => item.conversationId === roomId));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function insertEmoji(emoji: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`.slice(0, 500);
    setText(next);
    requestAnimationFrame(() => {
      input?.focus();
      const cursor = Math.min(start + emoji.length, next.length);
      input?.setSelectionRange(cursor, cursor);
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || !conversationId) return;
    setText("");
    try {
      await imClient.sendText(conversationId, content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err, "消息发送失败"));
    }
  }

  const visible = conversationId
    ? messages.filter((item) => item.conversationId === conversationId)
    : messages;

  return (
    <div className="flex grow shrink basis-0 flex-col rounded-lg bg-white" style={{ padding: "16px 16px 18px" }}>
      <div className="flex items-center gap-2">
        <img src="/images/study/im-icon.png" alt="" width={16} height={16} className="flex-shrink-0" />
        <h2 className="font-medium" style={{ fontSize: 16, color: "#222" }}>聊天互动</h2>
      </div>
      {error ? <p className="mt-2 text-xs" style={{ color: "#F16767" }}>{error}</p> : null}
      <div
        className="mt-3 flex min-h-[380px] grow shrink basis-0 flex-col gap-3 overflow-y-auto lg:min-h-0"
        style={{ scrollbarWidth: "thin" }}
      >
        {!error && !ready ? <p style={{ fontSize: 14, color: "#999" }}>正在加入群聊…</p> : null}
        {ready && visible.length === 0 ? <p style={{ fontSize: 14, color: "#999" }}>还没有消息，打个招呼吧。</p> : null}
        {visible.map((item) => {
          const mine = imClient.isOwnMessage(item, [user?.id, user?.uuid]);
          return mine ? (
            <div key={item.id} className="flex flex-col items-end">
              <p className="whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-right"
                style={{ maxWidth: "90%", fontSize: 14, lineHeight: "22px", backgroundColor: "#0F62FE", color: "#fff" }}>
                {item.content}
              </p>
            </div>
          ) : (
            <div key={item.id} className="flex flex-col items-start">
              <p
                className="whitespace-pre-wrap break-words rounded-lg px-3 py-2"
                style={{ maxWidth: "90%", fontSize: 14, lineHeight: "22px", backgroundColor: "#f6f8fc", color: "#555" }}
              >
                <span style={{ color: "#0F62FE", marginRight: 8 }}>{item.userName}</span>
                {item.content}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form className="mt-4 flex items-center gap-2" onSubmit={submit}>
        <Input
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={ready ? "发表你的意见吧" : "群聊未就绪"}
          disabled={!ready}
          maxLength={500}
        />
        <ChatEmojiPicker disabled={!ready} onPick={insertEmoji} />
        <Button
          type="submit"
          disabled={!ready || !text.trim()}
          className="rounded-full px-5"
          style={{ backgroundColor: "#0F62FE" }}
        >
          发送
        </Button>
      </form>
    </div>
  );
}
