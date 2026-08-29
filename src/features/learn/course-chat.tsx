"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { ChatEmojiPicker } from "./chat-emoji-picker";
import { getApiErrorMessage } from "@/lib/forms";
import { imClient, type ChatMessage } from "@/lib/im-client";
import { browserTokenStorage } from "@/features/auth/token-storage";

export function CourseChat({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string>();
  const [title, setTitle] = useState("班级群聊");
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
        setTitle(room.title);
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
    <Card className="flex h-full min-h-0 aspect-video flex-col p-4 lg:aspect-auto">
      <h2 className="font-semibold">{title}</h2>
      {error ? <p className="mt-2 text-sm text-muted-foreground">{error}</p> : null}
      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto text-sm">
        {!error && !ready ? <p className="text-muted-foreground">正在加入群聊…</p> : null}
        {ready && visible.length === 0 ? <p className="text-muted-foreground">还没有消息，打个招呼吧。</p> : null}
        {visible.map((item) => {
          const mine = imClient.isOwnMessage(item, [user?.id, user?.uuid]);
          return (
            <div key={item.id} className={mine ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground">{mine ? "我" : item.userName}</p>
              <p className={`mt-0.5 inline-block max-w-[90%] whitespace-pre-wrap break-words rounded-md px-3 py-1.5 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {item.content}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form className="mt-3 flex gap-2" onSubmit={submit}>
        <Input
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={ready ? "输入消息" : "群聊未就绪"}
          disabled={!ready}
          maxLength={500}
        />
        <ChatEmojiPicker disabled={!ready} onPick={insertEmoji} />
        <Button type="submit" disabled={!ready || !text.trim()}>发送</Button>
      </form>
    </Card>
  );
}
