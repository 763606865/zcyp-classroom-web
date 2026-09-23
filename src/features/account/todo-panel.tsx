"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { MyExam, MyHomework } from "@/entities/classroom";
import { formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyExams, getMyHomeworks } from "./api";

type TodoTab = "all" | "homework" | "course" | "exam";

const HOMEWORK_TODO = new Set(["pending", "draft", "returned"]);
const EXAM_TODO = new Set(["pending", "in_progress"]);

interface TodoItem {
  id: string;
  type: "homework" | "course" | "exam";
  content: string;
  time: string;
  href?: string;
}

const tagStyles: Record<string, { bg: string; color: string; label: string }> = {
  homework: { bg: "#E3F9E9", color: "#2BA471", label: "作业" },
  course: { bg: "#FFF1E9", color: "#E37318", label: "课程" },
  exam: { bg: "#E7EFFF", color: "#0F62FE", label: "考试" },
};

const tabs: { id: TodoTab; label: string }[] = [
  { id: "all", label: "全部待办" },
  { id: "homework", label: "作业待办" },
  { id: "course", label: "课程待办" },
  { id: "exam", label: "考试待办" },
];

function homeworkAction(status: string) {
  if (status === "pending") return "开始作答";
  if (status === "draft") return "继续作答";
  return "重新作答";
}

function examAction(item: MyExam) {
  if (item.progress_status === "in_progress") return "继续考试";
  return "进入考场";
}

export function TodoPanel() {
  const [activeTab, setActiveTab] = useState<TodoTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getMyHomeworks({ status: "pending", per_page: 20 }),
      getMyHomeworks({ status: "draft", per_page: 20 }),
      getMyHomeworks({ status: "returned", per_page: 20 }),
      getMyExams({ status: "pending", per_page: 20 }),
      getMyExams({ status: "in_progress", per_page: 20 }),
    ])
      .then(([pendingHw, draftHw, returnedHw, pendingEx, progressEx]) => {
        if (cancelled) return;
        const items: TodoItem[] = [];

        const homeworkTodos = [...pendingHw.data.data, ...draftHw.data.data, ...returnedHw.data.data]
          .filter((item) => HOMEWORK_TODO.has(item.progress_status));
        homeworkTodos.forEach((hw) => {
          items.push({
            id: `hw-${hw.id}`,
            type: "homework",
            content: `${hw.title} ${homeworkAction(hw.progress_status)}`,
            time: hw.deadline_at ? formatDateTime(hw.deadline_at) : "",
            href: `/account/homeworks/${hw.id}`,
          });
        });

        const examTodos = [...pendingEx.data.data, ...progressEx.data.data]
          .filter((item) => EXAM_TODO.has(item.progress_status));
        examTodos.forEach((ex) => {
          items.push({
            id: `ex-${ex.id}`,
            type: "exam",
            content: `${ex.title} ${examAction(ex)}`,
            time: ex.end_at ? formatDateTime(ex.end_at) : "",
            href: `/account/exams/${ex.id}`,
          });
        });

        setTodos(items);
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex min-h-[232px] items-center justify-center"><Spinner label="加载待办事项" /></div>;

  const filtered = activeTab === "all" ? todos : todos.filter((t) => t.type === activeTab);
  const showEmpty = filtered.length === 0;
  const hasData = todos.length > 0;

  return (
    <div className="rounded-lg" style={{ background: "#F6F8FC", padding: "14px 12px 8px" }}>
      {/* Tab 切换 - 有数据时才显示 */}
      {hasData && (
        <div className="flex border-b" style={{ borderColor: "#E7E7E7" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className="h-[54px] px-4 text-sm transition-colors"
              style={{
                color: activeTab === t.id ? "#0F62FE" : "#222",
                borderBottom: activeTab === t.id ? "2px solid #0F62FE" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* 列表 / 空状态 */}
      {showEmpty ? (
        <div className="flex min-h-[232px] flex-col items-center justify-center">
          <img src="/images/personal/work-emty.png" alt="" className="h-[94px] w-[109px]" width={109} height={94} />
          <p className="mt-4 text-sm" style={{ color: "#555" }}>{error || "暂无待办事项"}</p>
        </div>
      ) : (
          <div>
            {filtered.map((item) => {
              const tag = tagStyles[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                  style={{ height: "54px", borderBottom: "1px solid #E7E7E7" }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="shrink-0 rounded px-2 py-[2px] text-xs"
                      style={{ background: tag.bg, color: tag.color }}
                    >
                      {tag.label}
                    </span>
                    {item.href ? (
                      <Link href={item.href} className="truncate text-sm hover:text-primary" style={{ color: "#222" }}>
                        {item.content}
                      </Link>
                    ) : (
                      <span className="truncate text-sm" style={{ color: "#222" }}>{item.content}</span>
                    )}
                  </div>
                  <span className="shrink-0 pl-4 text-sm" style={{ color: "#222" }}>{item.time}</span>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
