"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyCourse } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyCourses, getMyExams, getMyFavorites, getMyHomeworks } from "./api";
import { TodoPanel } from "./todo-panel";

const HOMEWORK_TODO = new Set(["pending", "draft", "returned"]);
const EXAM_TODO = new Set(["pending", "in_progress"]);

const statIcons = [
  "/images/personal/preview-icon1.png",
  "/images/personal/preview-icon2.png",
  "/images/personal/preview-icon3.png",
  "/images/personal/preview-icon4.png",
];

export function AccountOverviewPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [courseTotal, setCourseTotal] = useState(0);
  const [homeworkTotal, setHomeworkTotal] = useState(0);
  const [examTotal, setExamTotal] = useState(0);
  const [favoriteTotal, setFavoriteTotal] = useState(0);
  const [courses, setCourses] = useState<MyCourse[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getMyCourses("learning"),
      getMyHomeworks({ status: "pending", per_page: 5 }),
      getMyHomeworks({ status: "draft", per_page: 5 }),
      getMyHomeworks({ status: "returned", per_page: 5 }),
      getMyExams({ status: "pending", per_page: 5 }),
      getMyExams({ status: "in_progress", per_page: 5 }),
      getMyFavorites({ per_page: 1 }),
    ])
      .then(([courseResult, pendingHw, draftHw, returnedHw, pendingEx, progressEx, favoriteResult]) => {
        if (cancelled) return;
        const homeworkTodos = [...pendingHw.data.data, ...draftHw.data.data, ...returnedHw.data.data]
          .filter((item) => HOMEWORK_TODO.has(item.progress_status));
        const examTodos = [...pendingEx.data.data, ...progressEx.data.data]
          .filter((item) => EXAM_TODO.has(item.progress_status));
        setCourses(courseResult.data.data.slice(0, 6));
        setCourseTotal(courseResult.data.total);
        setHomeworkTotal(pendingHw.data.total + draftHw.data.total + returnedHw.data.total);
        setExamTotal(pendingEx.data.total + progressEx.data.total);
        setFavoriteTotal(favoriteResult.data.total);
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex min-h-[198px] items-center justify-center"><Spinner label="加载学习概览" /></div>;
  if (error) return <EmptyState title="无法加载概览" description={error} />;

  const stats = [
    { label: "进行中的课程", value: courseTotal },
    { label: "待交作业", value: homeworkTotal },
    { label: "待考考试", value: examTotal },
    { label: "我的收藏", value: favoriteTotal },
  ];

  const hasCourses = courses.length > 0;

  return (
    <div>
      <h1 className="text-[20px] font-semibold" style={{ color: "#222" }}>学习概览</h1>
      <p className="mt-[6px] text-sm" style={{ color: "rgba(34, 34, 34, 0.6)" }}>从这里继续上课、交作业或参加考试。</p>

      {/* 统计卡片 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-lg"
            style={{
              background: "#F6F8FC",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)",
              padding: "10px 16px 16px 24px",
            }}
          >
            <div>
              <p className="text-sm" style={{ color: "#555", lineHeight: "22px" }}>{stat.label}</p>
              <p className="mt-2 text-[28px] font-semibold tabular-nums" style={{ color: "#0F62FE", lineHeight: "36px" }}>{stat.value}</p>
            </div>
            <img
              src={statIcons[i]}
              alt=""
              className="h-[47px] w-[47px] shrink-0"
              width={47}
              height={47}
            />
          </div>
        ))}
      </div>

      {/* 继续学习 */}
      <div className="mt-8">
        <h2 className="text-base font-semibold" style={{ color: "#222" }}>继续学习</h2>
        {!hasCourses ? (
          <div className="mt-6 flex min-h-[198px] flex-col items-center justify-center rounded-lg border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
            <img src="/images/personal/study-emty.png" alt="" className="h-[75px] w-[92px]" width={92} height={75} />
            <p className="mt-4 text-sm" style={{ color: "#555" }}>暂无学习项目</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {courses.map((item) => (
              <CourseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 待办事项 */}
      <div className="mt-[30px]">
        <TodoPanel />
      </div>
    </div>
  );
}

function CourseCard({ item }: { item: MyCourse }) {
  const progress = item.progress ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
      {/* 头部数据区 */}
      <div className="flex" style={{ padding: "8px 16px 12px 10px" }}>
        <CoverImage src={item.course.cover} alt="" className="h-[98px] w-[168px] shrink-0 rounded-md object-cover" />
        <div className="ml-[10px] min-w-0 flex-1">
          <Link href={`/account/courses/${item.course.id}`} className="line-clamp-2 text-lg font-semibold hover:text-primary" style={{ color: "#222" }}>
            {item.course.title}
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: "#999" }}>学习进度</span>
            <span className="text-sm tabular-nums">
              <span style={{ color: "#1667FE" }}>{progress}</span>
              <span style={{ color: "#222" }}>/100</span>
            </span>
          </div>
          {/* 进度条 */}
          <div className="mt-[5px] h-[9px] overflow-hidden rounded-[10px]" style={{ background: "#F4F4F4" }}>
            <div
              className="h-full rounded-[10px]"
              style={{
                width: `${Math.min(100, progress)}%`,
                background: "linear-gradient( 90deg, #6FA1FF 0%, #0F62FE 100%)",
              }}
            />
          </div>
        </div>
      </div>
      {/* 底部按钮 */}
      <div className="flex" style={{ borderTop: "1px solid #ECECEC" }}>
        <Link
          href={`/account/courses/${item.course.id}`}
          className="flex h-[41px] flex-1 items-center justify-center text-sm"
          style={{ color: "#0F62FE", background: "#F6F8FC" }}
        >
          继续学习
        </Link>
        <div className="my-[8px] w-px" style={{ background: "#DBDBDB", height: "25px", alignSelf: "center" }} />
        <button
          type="button"
          className="flex h-[41px] flex-1 items-center justify-center text-sm"
          style={{ color: "#F16767", background: "#F6F8FC" }}
        >
          删除课程
        </button>
      </div>
    </div>
  );
}
