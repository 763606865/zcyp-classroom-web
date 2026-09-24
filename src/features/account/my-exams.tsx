"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import type { MyExam } from "@/entities/classroom";
import { formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyExams } from "./api";

type StatusFilter = "" | "pending" | "in_progress" | "submitted" | "scored" | "timeout";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "", label: "全部" },
  { id: "pending", label: "未开始" },
  { id: "in_progress", label: "作答中" },
  { id: "submitted", label: "待阅卷" },
  { id: "scored", label: "已出分" },
  { id: "timeout", label: "已超时" },
];



function durationText(minutes?: number | null) {
  if (minutes == null || minutes <= 0) return "不限时";
  return `${minutes} 分钟`;
}

const statusIconMap: Record<string, string> = {
  in_progress: "/images/personal/exam-icon1.png",
  pending: "/images/personal/exam-icon2.png",
  scored: "/images/personal/exam-icon3.png",
  timeout: "/images/personal/exam-icon4.png",
  submitted: "/images/personal/exam-icon5.png",
};

function ExamCardItem({ item }: { item: MyExam }) {
  const iconSrc = statusIconMap[item.progress_status] ?? "/images/personal/exam-icon.png";

  function renderButtons() {
    switch (item.progress_status) {
      case "in_progress":
        return (
          <div className="flex gap-[20px]">
            <Link href={`/account/exams/${item.id}`} className="flex h-[32px] flex-1 items-center justify-center rounded-md bg-[#0F62FE] text-sm text-white">继续考试</Link>
            <Link href={`/account/exams/${item.id}?submit=true`} className="flex h-[32px] flex-1 items-center justify-center rounded-md border border-[#0F62FE] bg-transparent text-sm text-[#0F62FE]">提交试卷</Link>
          </div>
        );
      case "pending":
        return (
          <div className="flex gap-[20px]">
            <Link href={`/account/exams/${item.id}`} className="flex h-[32px] flex-1 items-center justify-center rounded-md bg-[#0F62FE] text-sm text-white">进入考试</Link>
            <Link href={`/account/exams/${item.id}?submit=true`} className="flex h-[32px] flex-1 items-center justify-center rounded-md border border-[#0F62FE] bg-transparent text-sm text-[#0F62FE]">提交试卷</Link>
          </div>
        );
      case "scored":
        return (
          <Link href={`/account/exams/${item.id}`} className="flex h-[32px] w-full items-center justify-center rounded-md border border-[#0F62FE] bg-transparent text-sm text-[#0F62FE]">查看成绩</Link>
        );
      case "timeout":
        return (
          <Link href={`/account/exams/${item.id}?submit=true`} className="flex h-[32px] w-full items-center justify-center rounded-md border border-[#0F62FE] bg-transparent text-sm text-[#0F62FE]">提交试卷</Link>
        );
      case "submitted":
        return null;
      default:
        return null;
    }
  }

  return (
		<div
			className="relative overflow-hidden rounded-xl border bg-white"
			style={{ borderColor: '#ECECEC', padding: '12px 20px' }}
		>
			{/* 右上角状态图标 */}
			<img
				src={iconSrc}
				alt=""
				className="absolute right-[-3px] top-[6px]"
				width={50}
				height={24}
			/>
			{/* 第一行：标题 */}
			<div className="flex items-center gap-[10px]">
				<img
					src="/images/personal/exam-icon.png"
					alt=""
					className="h-[32px] w-[32px] shrink-0"
					width={32}
					height={32}
				/>
				<Link
					href={`/account/exams/${item.id}`}
					className="min-w-0 truncate text-base font-semibold hover:text-[#0F62FE]"
					style={{ color: '#222', fontSize: 16 }}
				>
					{item.title}
				</Link>
			</div>
			{/* 第二行：考试时间 */}
			<div className="mt-[12px]">
				<span style={{ fontSize: 14, color: '#555' }}>
					考试时间：
					{item.start_at && item.end_at
						? `${formatDateTime(item.start_at)}–${formatDateTime(item.end_at)}`
						: '待定'}
				</span>
			</div>
			{/* 第三行：考试时长、总分、合格线 */}
			<div className="mt-[10px] flex items-center gap-[24px]">
				<span style={{ fontSize: 14, color: '#555' }}>
					考试时长：{durationText(item.duration_minutes)}
				</span>
				<span style={{ fontSize: 14, color: '#555' }}>总分：{item.total_score ?? '-'}</span>
				<span style={{ fontSize: 14, color: '#555' }}>
					合格线：{item.pass_score ?? '-'}
				</span>
			</div>
			{/* 第四行：按钮 */}
			<div className="mt-[14px]">{renderButtons()}</div>
		</div>
  );
}

export function MyExamsPanel() {
  const [items, setItems] = useState<MyExam[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void getMyExams({ status: status || undefined, page, per_page: 6 })
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
      {loading ? <Spinner label="加载我的考试" /> : null}
      {!loading && error ? <EmptyState title="无法加载考试" description={error} /> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
          <img src="/images/personal/exam-emty.png" alt="" className="h-[79px] w-[92px]" width={92} height={79} />
          <p className="mt-4 text-sm" style={{ color: "#555" }}>暂无考试</p>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="mt-[18px] grid grid-cols-1 gap-x-4 gap-y-[16px] sm:grid-cols-2">
          {items.map((item) => (
            <ExamCardItem key={item.id} item={item} />
          ))}
        </div>
      ) : null}
      {lastPage > 1 && !loading ? (
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
