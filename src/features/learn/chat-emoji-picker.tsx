"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "😉", "😍", "😘", "😋", "😜",
  "🤗", "🤩", "🤔", "😐", "😏", "😒", "🙄", "😬",
  "😌", "😔", "😪", "😴", "😷", "🤒", "🤯", "😎",
  "🥳", "😭", "😤", "😡", "🤬", "😱", "😳", "🥺",
  "👍", "👎", "👏", "🙏", "💪", "✌️", "🤝", "❤️",
  "🔥", "⭐", "🎉", "💯", "✅", "❌", "📌", "💡",
];

export function ChatEmojiPicker({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        className="px-3"
        disabled={disabled}
        aria-label="插入表情"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Smile className="size-4" />
      </Button>
      {open ? (
        <div className="absolute bottom-full right-0 z-20 mb-2 grid max-h-48 w-64 grid-cols-8 gap-1 overflow-y-auto rounded-md border border-border bg-surface p-2 shadow-lg">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex size-7 items-center justify-center rounded text-lg hover:bg-muted"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
