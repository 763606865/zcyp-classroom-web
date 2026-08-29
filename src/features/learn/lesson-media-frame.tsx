"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { imClient, type ChatMessage } from "@/lib/im-client";
import { danmakuEnabledStorage, readDanmakuEnabled } from "./danmaku-storage";

type FlyingItem = {
  key: string;
  text: string;
  top: number;
  duration: number;
};

function DanmakuLayer({ enabled }: { enabled: boolean }) {
  const [items, setItems] = useState<FlyingItem[]>([]);
  const seenRef = useRef(new Set<string>());
  const primedRef = useRef(false);

  useEffect(() => {
    primedRef.current = false;
    seenRef.current = new Set();
    const unsubscribe = imClient.subscribe((all) => {
      if (!primedRef.current) {
        for (const message of all) seenRef.current.add(message.id);
        primedRef.current = true;
        return;
      }
      const incoming = all.filter((message) => !seenRef.current.has(message.id));
      if (!incoming.length) return;
      for (const message of incoming) seenRef.current.add(message.id);
      if (!enabled) return;
      const next = incoming.map((message, index) => toFlyingItem(message, index));
      setItems((current) => [...current, ...next].slice(-30));
    });
    return () => {
      unsubscribe();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {items.map((item) => (
        <span
          key={item.key}
          className="absolute left-full whitespace-nowrap text-sm font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          style={{
            top: `${item.top}%`,
            animation: `im-danmaku ${item.duration}s linear forwards`,
          }}
          onAnimationEnd={() => {
            setItems((current) => current.filter((entry) => entry.key !== item.key));
          }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

function toFlyingItem(message: ChatMessage, index: number): FlyingItem {
  return {
    key: `${message.id}-${index}-${Date.now()}`,
    text: message.content.slice(0, 80),
    top: 2 + ((message.id.length + index * 5) % 16),
    duration: 7 + (message.content.length % 4),
  };
}

export function LessonMediaFrame({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(readDanmakuEnabled);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    danmakuEnabledStorage.set(next ? "true" : "false");
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {children}
      <DanmakuLayer enabled={enabled} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end bg-gradient-to-t from-black/55 to-transparent px-3 pb-2 pt-10">
        <button
          type="button"
          className="pointer-events-auto rounded-md bg-black/55 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 hover:bg-black/70"
          aria-pressed={enabled}
          onClick={toggle}
        >
          {enabled ? "弹幕开" : "弹幕关"}
        </button>
      </div>
    </div>
  );
}
