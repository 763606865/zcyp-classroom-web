"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import type { MyHomework } from "@/entities/classroom";
import { formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyHomeworks } from "./api";

type StatusFilter = "" | "pending" | "draft" | "submitted" | "reviewed" | "returned";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "", label: "全部" },
  { id: "pending", label: "未开始" },
  { id: "draft", label: "草稿" },
  { id: "submitted", label: "待批改" },
  { id: "reviewed", label: "已批改" },
  { id: "returned", label: "已退回" },
];

const statusIconMap: Record<string, string> = {
  submitted: "/images/personal/homework-icon1.png",
  pending: "/images/personal/homework-icon2.png",
  draft: "/images/personal/homework-icon3.png",
  reviewed: "/images/personal/homework-icon4.png",
  returned: "/images/personal/homework-icon5.png",
};


export function MyHomeworksPanel() {
  const [items, setItems] = useState<MyHomework[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void getMyHomeworks({ status: status || undefined, page, per_page: 9 })
      .then((result) => {
        if (cancelled) return;
        setItems(result.data.data);
        setLastPage(result.data.last_page ?? 1);
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, page]);

  function handleFilter(next: StatusFilter) {
    setStatus(next);
    setPage(1);
    setLoading(true);
    setError(undefined);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((item) => (
          <button
            key={item.id || "all"}
            type="button"
            onClick={() => handleFilter(item.id)}
            style={{
              fontSize: 14,
              color: status === item.id ? "#0F62FE" : "#999",
              padding: "6px 19px",
              border: `1px solid ${status === item.id ? "#0F62FE" : "#ECECEC"}`,
              borderRadius: 6,
              background: status === item.id ? "rgba(15, 98, 254, 0.1)" : "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {loading ? <Spinner label="加载我的作业" /> : null}
      {!loading && error ? <EmptyState title="无法加载作业" description={error} /> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
          <img src="/images/personal/homework-emty.png" alt="" className="h-[79px] w-[92px]" width={92} height={79} />
          <p className="mt-4 text-sm" style={{ color: "#555" }}>暂无作业</p>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="mt-[16px] grid grid-cols-1 gap-[16px] sm:grid-cols-2 md:grid-cols-3">
          {items.map((item) => {
            const iconSrc = statusIconMap[item.progress_status] ?? "/images/personal/homework-icon.png";
            const attachmentText = item.attachment_urls && item.attachment_urls.length > 0
              ? item.attachment_urls.map(url => url.split('/').pop()).join(', ')
              : '无附件';
            return (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: '#ECECEC', padding: '12px 16px' }}
              >
                {/* 右上角状态图标 */}
                <img
                  src={iconSrc}
                  alt=""
                  className="absolute right-[-3px] top-[6px]"
                  width={50}
                  height={24}
                />
                {/* 第一行：图标和标题 */}
                <div className="flex items-center gap-[6px]">
                  <img
                    src="/images/personal/homework-icon.png"
                    alt=""
                    className="h-[30px] w-[30px] shrink-0"
                    width={30}
                    height={30}
                  />
                  <Link
                    href={`/account/homeworks/${item.id}`}
                    className="min-w-0 truncate text-base font-semibold hover:text-[#0F62FE]"
                    style={{ color: '#222', fontSize: 16 }}
                  >
                    {item.title}
                  </Link>
                </div>
                {/* 第二行：截止时间 */}
                <div className="mt-[14px]">
                  <span style={{ fontSize: 14, color: '#555' }}>
                    截止时间：{item.deadline_at ? formatDateTime(item.deadline_at) : '待定'}
                  </span>
                </div>
                {/* 第三行：附件 */}
                <div className="mt-[10px]">
                  <span style={{ fontSize: 14, color: '#555' }}>
                    作业附件：{attachmentText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {lastPage >= 1 && !loading ? (
        <div className="mt-4 flex justify-end">
          <Pagination
            page={page}
            lastPage={lastPage}
            loading={loading}
            onPageChange={(p) => { setPage(p); setLoading(true); }}
          />
        </div>
      ) : null}
    </div>
  );
}
