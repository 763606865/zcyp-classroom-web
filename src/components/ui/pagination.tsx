"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export function Pagination({
  page,
  lastPage,
  loading,
  onPageChange,
}: {
  page: number;
  lastPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const [jumpPage, setJumpPage] = useState("");

  // Generate page numbers to display
  const pages: (number | "ellipsis")[] = [];
  const maxVisible = 5;

  if (lastPage <= maxVisible) {
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    if (page <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(lastPage);
    } else if (page >= lastPage - 2) {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = lastPage - 3; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(lastPage);
    }
  }

  const handleJump = () => {
    const num = parseInt(jumpPage, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= lastPage) {
      onPageChange(num);
      setJumpPage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleJump();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Previous */}
      <button
        type="button"
        disabled={loading || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded border text-sm transition-colors",
          page <= 1
            ? "cursor-not-allowed border-[#ECECEC] text-[#999]"
            : "border-[#ECECEC] text-[#333] hover:border-[#0F62FE] hover:text-[#0F62FE]",
        )}
        aria-label="上一页"
      >
        &lt;
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-sm text-[#999]">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            disabled={loading}
            onClick={() => onPageChange(p)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded border text-sm transition-colors",
              p === page
                ? "border-[#0F62FE] bg-[#0F62FE] text-white"
                : "border-[#ECECEC] text-[#333] hover:border-[#0F62FE] hover:text-[#0F62FE]",
            )}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        disabled={loading || page >= lastPage}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded border text-sm transition-colors",
          page >= lastPage
            ? "cursor-not-allowed border-[#ECECEC] text-[#999]"
            : "border-[#ECECEC] text-[#333] hover:border-[#0F62FE] hover:text-[#0F62FE]",
        )}
        aria-label="下一页"
      >
        &gt;
      </button>

      {/* Jump */}
      <span className="ml-2 text-sm text-[#666]">跳转</span>
      <input
        type="number"
        min={1}
        max={lastPage}
        value={jumpPage}
        onChange={(e) => setJumpPage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-9 w-14 rounded border border-[#ECECEC] px-2 text-center text-sm text-[#333] outline-none focus:border-[#0F62FE]"
        aria-label="跳转页码"
      />
      <span className="text-sm text-[#666]">页</span>
    </div>
  );
}
