"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { TeacherProfile } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getTeachers } from "./api";
import { stripHtml } from "./labels";
import { teacherTopicMock } from "./topic-mock";
import { TopicPager } from "./topic-pager";

// ==================== Mock 数据 ====================

const bannerStats = [
  { label: "专职讲师", value: "6", unit: "位", icon: "/images/classplan/banner-icon1.png" },
  { label: "覆盖领域", value: "12", unit: "个", icon: "/images/classplan/banner-icon2.png" },
  { label: "企业内训", value: "80+", unit: "场", icon: "/images/classplan/banner-icon4.png" },
];

const chiefTeacherFallback = {
  name: "汤焱林",
  expertise: "经济师考前培训 | 公文写作 | 管理学 | 职业指导 | 人力资源 | 干部人事档案管理 | 党务",
  bio: "长期从事长度计量与几何量检测，参与多项省级比对，主讲岗位培训与企业内训。长期从事长度计量与几何量检测，参与多项省级比对，主讲岗位培训与企业内训。",
  tags: ["一线授课经验", "岗位案例教学", "考核要点辅导"],
};

const teachingSteps = [
  { title: "标准解读", desc: "把法规、规范和考核要点讲清楚，便于落到作业文件。", icon: "/images/classplan/box-icon1.png" },
  { title: "真机实操", desc: "结合仪器与现场案例，还原检测与校准场景。", icon: "/images/classplan/box-icon2.png" },
  { title: "考核辅导", desc: "围绕考核路径组织模拟、答疑与错题复盘。", icon: "/images/classplan/box-icon3.png" },
];

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
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] items-center px-4">
        {/* 左侧：标题 + 统计卡片 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[36px] leading-[44px] font-bold text-[#0F62FE]">师资力量</h1>
          <p className="mt-2 text-[14px] text-[#222222]/70">讲师来自计量检测一线，兼顾标准解读与现场实操。</p>

          <div className="mt-6 flex gap-3 flex-wrap">
            {bannerStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-lg bg-white"
                style={{
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  minWidth: 180,
                  flex: "1 1 180px",
                  maxWidth: 220,
                  padding: "10px 20px 14px 27px",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[24px] font-bold text-[#0F62FE]">
                    {stat.value}
                    <span className="ml-1 text-[14px] font-normal text-[#222222]">{stat.unit}</span>
                  </p>
                  <p className="text-[14px] text-[#222222]/60">{stat.label}</p>
                </div>
                <Image src={stat.icon} alt="" width={56} height={56} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：banner-img，底部对齐，顶部溢出13px */}
        <div className="relative shrink-0 hidden lg:block">
          <Image
            src="/images/teacher/banner-img.png"
            alt="师资力量"
            width={698}
            height={433}
            className="h-auto w-auto object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}

// ==================== 首席讲师区 ====================

function ChiefTeacherSection({ chief }: { chief: TeacherProfile | null }) {
  const name = chief?.name ?? chiefTeacherFallback.name;
  const expertise = chief?.expertise ?? chiefTeacherFallback.expertise;
  const bio = chief?.bio ? stripHtml(chief.bio) : chiefTeacherFallback.bio;
  const tags = chiefTeacherFallback.tags;
  const id = chief?.id;

  return (
    <section className="relative overflow-hidden" style={{ height: 454, background: "#fff" }}>
      {/* 蓝色渐变块：贴底，高390，上方留64白色 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 390,
          background: "linear-gradient(to right, #003399 30%, #0052D9 43%, #1677FF 54%)",
        }}
      >
        {/* 内容区 */}
        <div className="relative z-10 mx-auto flex h-full max-w-[1200px] items-end px-4">
          {/* 左侧：人物描述 */}
          <div className="flex-1 min-w-0 pb-10 pr-8">
            <h2 className="text-[32px] leading-[28px] font-bold text-white">{name}</h2>
            <p className="mt-[22px] text-[20px] leading-[30px] text-white">{expertise}</p>
            <p className="mt-[11px] text-[16px] leading-[30px] text-white/80 line-clamp-3">{bio}</p>
            <div className="mt-[22px] flex flex-wrap gap-[8px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/30 px-3 py-1 text-[14px] text-white bg-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {id ? (
                <Link
                  href={`/teachers/${id}`}
                  className="inline-flex items-center gap-1 rounded bg-white px-5 py-2 text-[14px] font-medium text-[#0F62FE] hover:bg-white/90 transition-colors"
                >
                  <Image src="/images/teacher/view-icon.png" alt="" width={16} height={16} />
                  查看详情
                </Link>
              ) : null}
              <Link
                href="/consult?source=teacher"
                className="inline-flex items-center rounded border border-white/40 px-5 py-2 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
              >
                免费试听
              </Link>
            </div>
          </div>

          {/* 右侧：人物图 */}
          <div className="relative shrink-0 hidden md:block">
            <Image
              src="/images/teacher/people-img.png"
              alt={name}
              width={422}
              height={438}
              className="h-auto w-auto object-contain"
              priority
            />
            {/* 首席讲师 Badge：底部42，左突出63 */}
            <div
              className="absolute flex items-center justify-center"
              style={{ bottom: 42, left: -63, width: 320, height: 63 }}
            >
              <Image
                src="/images/teacher/people-name.png"
                alt=""
                width={320}
                height={63}
                className="absolute inset-0 h-full w-full"
              />
              <span
                className="relative z-10 text-[36px] font-bold text-white"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                首席讲师
              </span>
            </div>
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
  domain,
  onDomainChange,
}: {
  keyword: string;
  onKeywordChange: (v: string) => void;
  domain: string;
  onDomainChange: (v: string) => void;
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
            <img src="/images/classplan/search-icon.png" alt="" width={18} height={18} />
          </button>
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="搜索姓名、头衔、单位或擅长领域"
            className="flex-1 border-0 bg-transparent px-3 text-sm text-[#222222] outline-none placeholder:text-[#999999]"
            style={{ height: 40 }}
          />
        </div>

        {/* 领域筛选 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onDomainChange("all")}
            className="rounded-[6px] text-sm transition-colors"
            style={{
              padding: "7px 15px",
              fontSize: 14,
              background: domain === "all" ? "rgba(15, 98, 254, 0.10)" : "transparent",
              color: domain === "all" ? "#0F62FE" : "#999999",
              border: `1px solid ${domain === "all" ? "#0F62FE" : "#ECECEC"}`,
            }}
          >
            全部领域
          </button>
          {teacherTopicMock.domains.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onDomainChange(item)}
              className="rounded-[6px] text-sm transition-colors"
              style={{
                padding: "7px 15px",
                fontSize: 14,
                background: domain === item ? "rgba(15, 98, 254, 0.10)" : "transparent",
                color: domain === item ? "#0F62FE" : "#999999",
                border: `1px solid ${domain === item ? "#0F62FE" : "#ECECEC"}`,
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

// ==================== 全部教师区 ====================

function TeacherCard({ teacher }: { teacher: TeacherProfile }) {
  return (
    <Link href={`/teachers/${teacher.id}`} className="block h-full">
      <div
        className="flex h-full flex-col rounded-lg bg-white p-6 transition-colors hover:shadow-md"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start gap-4">
          {/* 头像 */}
          <div className="size-[72px] shrink-0 overflow-hidden rounded-full bg-[#F5F5F5]">
            {teacher.avatar ? (
              <Image
                src={teacher.avatar}
                alt={teacher.name}
                width={72}
                height={72}
                className="size-[72px] object-cover"
              />
            ) : (
              <div className="flex size-[72px] items-center justify-center bg-[#EAF1FC] text-[24px] font-bold text-[#0F62FE]">
                {teacher.name?.charAt(0) ?? "师"}
              </div>
            )}
          </div>
          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-[22px] font-semibold text-[#222222]">{teacher.name}</h3>
              <span className="inline-flex shrink-0 items-center gap-[4px] text-[12px] text-[#0F62FE]">
                查看讲师主页
                <Image src="/images/home/more-icon.png" alt="" width={16} height={16} />
              </span>
            </div>
            <p className="mt-1 text-[14px] text-black/60">{teacher.title ?? "讲师"}</p>
            <p className="mt-2 text-[14px] text-black/60 line-clamp-1">{teacher.expertise ?? ""}</p>
          </div>
        </div>
        {/* 标签 */}
        <div className="mt-4 flex flex-wrap gap-[8px]">
          {["一线授课经验", "岗位案例教学", "考核要点辅导"].map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-[14px]"
              style={{ background: "#EAF1FC", color: "#0F62FE" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function AllTeachersSection({
  items,
  loading,
  error,
  total,
  page,
  lastPage,
  onPageChange,
}: {
  items: TeacherProfile[];
  loading: boolean;
  error?: string;
  total: number;
  page: number;
  lastPage: number;
  onPageChange: (p: number) => void;
}) {
  const displayItems = items.slice(0, 6);

  return (
    <section style={{ background: "#f6f8fc", paddingTop: 50, paddingBottom: 41 }}>
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">全部教师</h2>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="加载师资力量" />
            </div>
          ) : null}
          {!loading && error ? <EmptyState title="无法加载师资" description={error} /> : null}
          {!loading && !error && displayItems.length === 0 ? (
            <EmptyState title="没有匹配的讲师" description="试试更换关键词。" />
          ) : null}
          {!loading && !error && displayItems.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">共 {total} 位讲师</p>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                style={{ columnGap: 21, rowGap: 16 }}
              >
                {displayItems.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
              {lastPage > 1 ? (
                <div className="mt-6">
                  <TopicPager page={page} lastPage={lastPage} loading={loading} onPageChange={onPageChange} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ==================== 授课方式区 ====================

function TeachingMethodSection() {
  const quotes = teacherTopicMock.quotes;

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 420 }}>
      {/* 背景图 */}
      <div className="absolute inset-0">
        <Image
          src="/images/classplan/bg.png"
          alt=""
          width={1440}
          height={420}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 内容区 */}
      <div className="relative z-10 mx-auto max-w-[1200px] py-10">
        <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">授课方式</h2>
        <p className="mt-2 text-[14px] text-[#222222]/60">三种方式灵活选择，助力岗位能力提升</p>

        {/* 三项步骤卡片 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachingSteps.map((step) => (
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

        {/* 学员评价 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((item) => (
            <div
              key={item.name}
              className="rounded-lg bg-white p-5"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", maxWidth: 384 }}
            >
              <span className="text-[24px] leading-none text-[#0F62FE]/30">"</span>
              <p className="mt-[-20px] text-[14px] leading-7 text-[#222222]">{item.text}</p>
              <div className="w-full h-[1px] bg-[#ECECEC] mt-[27px]"></div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#EAF1FC] text-[12px] font-medium text-[#0F62FE]">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#222222]">{item.name}</p>
                  <p className="text-[12px] text-[#999999]">训练营学员</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 右下人物图 */}
        <Image
          src="/images/course/service-icon.png"
          alt=""
          width={294}
          height={170}
          className="absolute hidden lg:block"
          style={{ right: 0, bottom: -20, zIndex: 5 }}
        />
      </div>
    </section>
  );
}

// ==================== 主组件 ====================

export function TeachersListView() {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [items, setItems] = useState<TeacherProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getTeachers({
        q: keyword.trim() || (domain === "all" ? undefined : domain),
        page,
        per_page: 6,
      })
        .then((result) => {
          if (cancelled) return;
          setItems(result.data.data);
          setTotal(result.data.total);
          setLastPage(result.data.last_page ?? 1);
          setError(undefined);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(getApiErrorMessage(err, "师资列表加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, domain, page]);

  const chief = items[0] ?? null;

  const handleKeywordChange = (v: string) => {
    setKeyword(v);
    setDomain("all");
    setPage(1);
  };

  const handleDomainChange = (v: string) => {
    setDomain(v);
    setKeyword("");
    setPage(1);
  };

  return (
    <div>
      <BannerSection />
      <ChiefTeacherSection chief={chief} />
      <SearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        domain={domain}
        onDomainChange={handleDomainChange}
      />
      <AllTeachersSection
        items={items}
        loading={loading}
        error={error}
        total={total}
        page={page}
        lastPage={lastPage}
        onPageChange={setPage}
      />
      <TeachingMethodSection />
    </div>
  );
}
