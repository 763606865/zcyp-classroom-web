"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import type { ClassSchedule } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getClassSchedules } from "./api";
import { classScheduleStatusLabel, formatDate, formatPrice, trainingTypeLabels } from "./labels";
import { scheduleTopicMock } from "./topic-mock";

// ==================== Mock 数据 ====================

const bannerStats = [
  { label: "本月开班", value: "6", unit: "期", icon: "/images/classplan/banner-icon1.png" },
  { label: "进行中", value: "3", unit: "个班", icon: "/images/classplan/banner-icon2.png" },
  { label: "可报名", value: "4", unit: "个班", icon: "/images/classplan/banner-icon3.png" },
  { label: "覆盖方向", value: "6", unit: "个", icon: "/images/classplan/banner-icon4.png" },
];

const locationFilters = ["全部校区", "杭州", "武汉", "北京", "上海", "广州", "成都"];
const statusFilters = ["全部状态", "待开班", "进行中", "已结班"];

const chooseSteps = [
  { title: "01、提交咨询", desc: "留下岗位与意向开班时间", icon: "/images/classplan/box-icon1.png" },
  { title: "02、确认班级", desc: "教务匹配班级、地点与名额", icon: "/images/classplan/box-icon2.png" },
  { title: "03、缴费报名", desc: "确认费用后完成报名", icon: "/images/classplan/box-icon3.png" },
  { title: "04、到班学习", desc: "按开班时间参加学习与考核", icon: "/images/classplan/box-icon4.png" },
];

// ==================== 日历组件 ====================

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = [2025, 2026, 2027];

function CalendarWidget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const highlightDays = useMemo(() => {
    // mock 高亮日期
    const map: Record<string, number[]> = {
      "2026-9": [8, 12, 18, 22, 28],
      "2026-10": [5, 10, 15, 20, 25],
      "2026-8": [3, 7, 14, 21, 28],
    };
    return new Set(map[`${year}-${month}`] ?? [5, 10, 15, 20, 25]);
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  // 固定6行（42格），避免切换月份时高度抖动
  const totalCells = 42;
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const trailingBlanks = Array.from({ length: totalCells - blanks.length - days.length }, (_, i) => i);

  return (
    <div className="rounded-xl bg-white text-[#222222]" style={{ width: 375, height: 210, padding: '10px 12px', boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      {/* 月份和年份选择 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border border-[#E0E0E0] bg-white text-[#222222] outline-none focus:border-[#0F62FE]"
            style={{ height: 22, fontSize: 12, padding: '0 4px' }}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-[#E0E0E0] bg-white text-[#222222] outline-none focus:border-[#0F62FE]"
            style={{ height: 22, fontSize: 12, padding: '0 4px' }}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              if (month === 1) { setMonth(12); setYear(year - 1); }
              else setMonth(month - 1);
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-sm text-[#666] hover:bg-gray-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              if (month === 12) { setMonth(1); setYear(year + 1); }
              else setMonth(month + 1);
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-sm text-[#666] hover:bg-gray-100"
          >
            ›
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="mt-3 grid grid-cols-7 gap-0 text-center text-xs text-[#999999]">
        {WEEKDAYS.map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>

      {/* 日期网格 - 固定6行 */}
      <div className="grid grid-cols-7 gap-0 text-center text-sm" style={{ marginTop: 8 }}>
        {blanks.map((i) => <span key={`b-${i}`} />)}
        {days.map((day) => {
          const highlighted = highlightDays.has(day);
          const isToday = isCurrentMonth && day === today;
          return (
            <span
              key={day}
              className={`flex items-center justify-center justify-self-center rounded-full text-[13px] ${
                isToday
                  ? "bg-[#0F62FE] font-semibold text-white"
                  : highlighted
                    ? "bg-[#0F62FE] font-medium text-white"
                    : "text-[#222222]"
              }`}
              style={{ width: 20, height: 20 }}
            >
              {day}
            </span>
          );
        })}
        {trailingBlanks.map((i) => <span key={`t-${i}`} />)}
      </div>
    </div>
  );
}

// ==================== Banner 区 ====================

function BannerSection() {
  return (
    <section className="relative overflow-hidden" style={{ height: 420, background: "#F6F8FC" }}>
      {/* 背景图：底部对齐，顶部溢出64px */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: 484 }}>
        <Image
          src="/images/classplan/banner-bg.png"
          alt=""
          width={1440}
          height={484}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {/* 内容区 */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] items-center">
        {/* 左侧：标题 + 统计卡片 */}
        <div className="flex-1">
          <h1 className="text-[36px] leading-[44px] font-bold text-[#0F62FE]">开班计划</h1>
          <p className="mt-2 text-[14px] text-[#222222]/70">查看近期开班与进行中的班级，按时间报名。</p>

          <div className="mt-6 grid grid-cols-2 gap-3" style={{ maxWidth: 440 }}>
            {bannerStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-lg bg-white px-4 py-3"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <Image src={stat.icon} alt="" width={56} height={56} className="shrink-0" />
                <div>
                  <p className="text-[20px] font-bold text-[#0F62FE]">
                    {stat.value}
                    <span className="ml-1 text-[12px] font-normal text-[#999999]">{stat.unit}</span>
                  </p>
                  <p className="text-[12px] text-[#999999]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：日历图 + 日历组件 */}
        <div className="relative shrink-0">
          <Image
            src="/images/classplan/banner-img.png"
            alt="开班日历"
            width={812}
            height={390}
            className="h-auto w-auto object-contain"
            priority
          />
          {/* 日历组件覆盖在图上 */}
          <div className="absolute" style={{ left: 188, bottom: 108 }}>
            <CalendarWidget />
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== 搜索区 ====================

function SearchSection({
  keyword,
  onKeywordChange,
  location,
  onLocationChange,
  status,
  onStatusChange,
}: {
  keyword: string;
  onKeywordChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
}) {
  return (
		<section className="bg-white" style={{ paddingTop: 35, paddingBottom: 41 }}>
			<div className="mx-auto max-w-[1200px]">
				{/* 搜索框 */}
				<div className="flex items-center overflow-hidden rounded-lg border border-[#E0E0E0]">
					<button
						type="button"
						className="flex shrink-0 items-center justify-center bg-[#0F62FE]"
						aria-label="搜索"
						style={{ width: 40, height: 40 }}
					>
						<img
							src="/images/classplan/search-icon.png"
							alt=""
							width={18}
							height={18}
						/>
					</button>
					<input
						type="text"
						value={keyword}
						onChange={e => onKeywordChange(e.target.value)}
						placeholder="搜索班级、编码或培训标题"
						className="flex-1 border-0 bg-transparent px-3 text-sm text-[#222222] outline-none placeholder:text-[#999999]"
						style={{ height: 40 }}
					/>
				</div>

				{/* 校区筛选 */}
				<div className="mt-4 flex flex-wrap gap-2">
					{locationFilters.map(item => (
						<button
							key={item}
							type="button"
							onClick={() => onLocationChange(item)}
							className="rounded-[6px] text-sm transition-colors"
							style={{
								padding: '7px 15px',
								fontSize: 14,
								background: location === item ? 'rgba(15, 98, 254, 0.10)' : 'transparent',
								color: location === item ? '#0F62FE' : '#999999',
								border: `1px solid ${location === item ? '#0F62FE' : '#ECECEC'}`,
							}}
						>
							{item}
						</button>
					))}
				</div>

				{/* 状态筛选 */}
				<div className="mt-3 flex flex-wrap gap-2">
					{statusFilters.map(item => (
						<button
							key={item}
							type="button"
							onClick={() => onStatusChange(item)}
							className="rounded-[6px] text-sm transition-colors"
							style={{
								padding: '7px 15px',
								fontSize: 14,
								background: status === item ? 'rgba(15, 98, 254, 0.10)' : 'transparent',
								color: status === item ? '#0F62FE' : '#999999',
								border: `1px solid ${status === item ? '#0F62FE' : '#ECECEC'}`,
							}}
						>
							{item}
						</button>
					))}
				</div>
			</div>
		</section>
  );
}

// ==================== 培训班卡片 ====================

function ScheduleCard({ item }: { item: ClassSchedule }) {
  const training = item.training;
  const status = item.status;
  const trainingType = training?.type ?? "";

  // 状态标签样式
  const statusStyle = (() => {
    switch (status) {
      case "ongoing": return { bg: "#EAF1FC", color: "#0F62FE", label: "进行中" };
      case "pending": return { bg: "#F0F0F0", color: "#999999", label: "待开班" };
      case "finished": return { bg: "#FFF0F0", color: "#F16767", label: "已结束" };
      default: return { bg: "#F0F0F0", color: "#999999", label: classScheduleStatusLabel(status) };
    }
  })();

  // 授课方式颜色
  const typeColor = (() => {
    switch (trainingType) {
      case "online": return "#F16767";
      case "offline": return "#0F62FE";
      case "mixed": return "#0F62FE";
      default: return "#0F62FE";
    }
  })();

  const targetHref = training ? `/trainings/${training.slug}` : "/consult?source=schedule";

  return (
    <div className="overflow-hidden rounded-xl bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* 第一行：图片 + 标题/状态 */}
      <div className="flex gap-3" style={{ padding: "8px 16px 0" }}>
        {/* 课程图 */}
        <div className="shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]" style={{ width: 168, height: 98 }}>
          <CoverImage src={item.cover || training?.cover} alt={item.name} className="h-full w-full" />
        </div>

        {/* 右侧内容 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="line-clamp-2 text-[18px] leading-[24px] font-medium text-[#222222]">
            {item.name}
          </h3>
          <div className="mt-auto flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {statusStyle.label}
            </span>
            <span className="text-xs text-[#999999]">
              授课方式：
              <span style={{ color: typeColor }}>{trainingTypeLabels[trainingType] ?? trainingType}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 第二行：灰色信息块 */}
      <div className="mx-3 mt-3 rounded-lg" style={{ background: "#F5F7FB", padding: "10px 9px" }}>
        {/* 第一行：所属培训 + 报名人数 */}
        <div className="flex items-center justify-between text-[14px]">
          <div>
            <span className="text-[#999999]">所属培训：</span>
            <span className="text-[#222222]">{training?.title ?? "—"}</span>
          </div>
          <div>
            <span className="text-[#999999]">报名人数：</span>
            <span className="font-medium text-[#0F62FE]">{item.student_count ?? 0}</span>
            <span className="text-[#999999]">/{item.max_students ?? "—"}人</span>
          </div>
        </div>
        {/* 第二行：时间 + 讲师 */}
        <div className="mt-2 flex items-center gap-4 text-[14px] text-[#999999]">
          <div className="flex items-center gap-1">
            <Image src="/images/classplan/time-icon.png" alt="" width={16} height={16} className="shrink-0" />
            <span>{formatDate(item.start_at)}至{formatDate(item.end_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Image src="/images/classplan/people-icon.png" alt="" width={16} height={16} className="shrink-0" />
            <span>讲师{item.teacher?.name ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* 第三行：价格 + 按钮 */}
      <div className="flex items-center justify-between" style={{ padding: "10px 16px 12px" }}>
        <span className={`text-[16px] font-semibold ${training?.is_free ? "text-[#FEA500]" : "text-[#0F62FE]"}`}>
          {training ? formatPrice(training.is_free, training.price) : "免费"}
        </span>
        <div className="flex gap-2">
          <Link
            href={targetHref}
            className="inline-flex items-center rounded-md bg-[#0F62FE] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0B53D9]"
          >
            报名
          </Link>
          <Link
            href={targetHref}
            className="inline-flex items-center rounded-md border border-[#0F62FE] px-4 py-1.5 text-sm font-medium text-[#0F62FE] transition-colors hover:bg-[#EAF1FC]"
          >
            试听
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== 培训班列表区 ====================

function TrainingListSection() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [location, setLocation] = useState("全部校区");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [items, setItems] = useState<ClassSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const apiStatus = status === "全部状态" ? undefined : status === "待开班" ? "pending" : status === "进行中" ? "ongoing" : "finished";

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getClassSchedules({
        q: keyword.trim() || undefined,
        status: apiStatus,
        page,
        per_page: 12,
      })
        .then((result) => {
          if (cancelled) return;
          setItems(result.data.data);
          setTotal(result.data.total);
          setLastPage(result.data.last_page ?? 1);
          setError(undefined);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(getApiErrorMessage(err, "开班计划加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, apiStatus, page]);

  const visibleItems = useMemo(() => {
    let filtered = items;
    if (location !== "全部校区") {
      filtered = filtered.filter((item) => (item.training?.location ?? "").includes(location));
    }
    if (sortBy === "time") {
      filtered = [...filtered].sort((a, b) => {
        const da = a.start_at ? new Date(a.start_at).getTime() : 0;
        const db = b.start_at ? new Date(b.start_at).getTime() : 0;
        return db - da;
      });
    }
    return filtered;
  }, [items, location, sortBy]);

  const handleKeywordChange = (v: string) => { setKeyword(v); setPage(1); };
  const handleStatusChange = (v: string) => { setStatus(v); setPage(1); };
  const handleLocationChange = (v: string) => { setLocation(v); setPage(1); };

  return (
    <>
      <SearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        location={location}
        onLocationChange={handleLocationChange}
        status={status}
        onStatusChange={handleStatusChange}
      />

      <section style={{ background: "#F6F8FC", paddingTop: 50, paddingBottom: 41 }}>
        <div className="mx-auto max-w-[1200px]">
          {/* 标题 + 排序 */}
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">全部培训班</h2>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded border border-[#E0E0E0] bg-white py-1.5 pl-3 pr-8 text-sm text-[#666666] outline-none focus:border-[#0F62FE]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
              >
                <option value="default">综合排序</option>
                <option value="time">时间</option>
              </select>
            </div>
          </div>

          {/* 列表内容 */}
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-16"><Spinner label="加载开班计划" /></div>
            ) : null}
            {!loading && error ? (
              <EmptyState title="无法加载开班计划" description={error} />
            ) : null}
            {!loading && !error && visibleItems.length === 0 ? (
              <EmptyState title="暂无开班安排" description="可以先浏览培训项目或提交咨询。" />
            ) : null}
            {!loading && !error && visibleItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ columnGap: 21, rowGap: 16 }}>
                  {visibleItems.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </div>
                <div className="mt-6">
                  <Pagination page={page} lastPage={lastPage} loading={loading} onPageChange={setPage} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== 如何选课区 ====================

function HowToChooseSection() {
  return (
    <section className="relative overflow-hidden" style={{ height: 314 }}>
      {/* 背景图 */}
      <div className="absolute inset-0">
        <Image
          src="/images/classplan/bg.png"
          alt=""
          width={1440}
          height={314}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 内容区 */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center px-4">
        <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">如何选课</h2>
        <p className="mt-2 text-[14px] text-[#222222]/60">四步快速匹配适合你的课程</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chooseSteps.map((step) => (
            <div
              key={step.title}
              className="flex items-center gap-3 rounded-lg bg-white px-5 py-4"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <Image src={step.icon} alt="" width={48} height={48} className="shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-[#222222]">{step.title}</p>
                <p className="mt-1 text-[12px] text-[#999999]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== 报名须知（FAQ）区 ====================

function FAQSection() {
  return (
    <section className="py-[52px]" style={{ background: "#F6F8FC", paddingBottom: 82 }}>
      <div className="mx-auto max-w-[1200px]">
        {/* 标题 */}
        <div className="text-center">
          <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">报名须知</h2>
          <p className="mt-[9px] text-[14px] text-black/60">备考深造与岗位提升路上，这些是学员问得最多的问题。</p>
        </div>

        {/* FAQ 列表 */}
        <div className="mt-[29px] rounded-lg bg-white p-5">
          {scheduleTopicMock.notices.map((faq, idx) => (
            <div
              key={idx}
              className={idx < scheduleTopicMock.notices.length - 1 ? "border-b border-[#E3EAF4] py-5" : "py-5"}
            >
              {/* 问题 */}
              <div className="flex items-start gap-3">
                <Image
                  src="/images/classplan/question-icon.png"
                  alt="Q"
                  width={24}
                  height={24}
                  className="shrink-0 mt-0.5"
                />
                <p className="flex-1 text-[14px] font-medium text-[#222222]">{faq.q}</p>
                <Link
                  href="/consult?source=faq"
                  className="inline-flex shrink-0 items-center gap-[4px] text-[12px] text-[#0F62FE] hover:underline"
                >
                  咨询详情
                  <Image src="/images/classplan/more-icon.png" alt="" width={16} height={16} />
                </Link>
              </div>
              {/* 回答 */}
              <div className="mt-3 flex items-start gap-3">
                <Image
                  src="/images/classplan/answer-icon.png"
                  alt="A"
                  width={24}
                  height={24}
                  className="shrink-0 mt-0.5"
                />
                <p className="flex-1 text-[14px] leading-relaxed text-black/60">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 咨询更多问题按钮 */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/consult?source=faq-more"
            className="inline-flex items-center gap-[4px] rounded border border-[#0F62FE] px-5 py-2 text-sm text-[#0F62FE] transition-colors hover:bg-[#EAF1FC]"
          >
            咨询更多问题
            <Image src="/images/classplan/more-icon.png" alt="" width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==================== 主组件 ====================

export function ClassSchedulesView() {
  return (
    <div>
      <BannerSection />
      <TrainingListSection />
      <HowToChooseSection />
      <FAQSection />
    </div>
  );
}
