"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { MyHomework } from "@/entities/classroom";
import { getMyHomeworks } from "@/features/account/api";
import { formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";

export function CourseHomeworks({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [items, setItems] = useState<MyHomework[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getMyHomeworks({ page: 1, per_page: 50 })
      .then((result) => {
        if (cancelled) return;
        setItems(result.data.data.filter((item) => item.course?.id === courseId));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "课后作业加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Spinner label="加载课后作业" />
      </div>
    );
  }

  if (error) {
    return <p className="py-10 text-center" style={{ fontSize: 14, color: "#F16767" }}>{error}</p>;
  }

  if (items.length === 0) {
    return <p className="py-10 text-center" style={{ fontSize: 14, color: "#999" }}>暂无课后作业</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="cursor-pointer overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
          style={{ borderColor: "#ECECEC", padding: "12px 16px" }}
          onClick={() => router.push(`/account/homeworks/${item.id}`)}
        >
          {/* 第一行：图标和标题 */}
          <div className="flex items-center gap-[6px]">
            <img
              src="/images/personal/homework-icon.png"
              alt=""
              className="h-[30px] w-[30px] shrink-0"
              width={30}
              height={30}
            />
            <span
              className="min-w-0 truncate font-semibold"
              style={{ color: "#222", fontSize: 16 }}
            >
              {item.title}
            </span>
          </div>
          {/* 第二行：截止时间 */}
          <div className="mt-[14px]">
            <span style={{ fontSize: 14, color: "#555" }}>
              截止时间：{item.deadline_at ? formatDateTime(item.deadline_at) : "待定"}
            </span>
          </div>
          {/* 第三行：附件（点击下载，不触发卡片跳转） */}
          <div className="mt-[10px] flex flex-wrap items-center gap-x-[6px]">
            <span style={{ fontSize: 14, color: "#555" }}>作业附件：</span>
            {item.attachment_urls && item.attachment_urls.length > 0 ? (
              item.attachment_urls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="hover:underline"
                  style={{ fontSize: 14, color: "#0F62FE" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {url.split("/").pop()}
                </a>
              ))
            ) : (
              <span style={{ fontSize: 14, color: "#555" }}>无附件</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
