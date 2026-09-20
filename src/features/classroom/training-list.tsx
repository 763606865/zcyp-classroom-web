"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { Category, TrainingCard } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getTrainings } from "./api";
import { formatPrice, trainingTypeColors, trainingTypeLabels } from "./labels";

/* ── Training Card (与教师详情页一致) ── */
function TrainingCardItemStyled({ training }: { training: TrainingCard }) {
  const typeColor = trainingTypeColors[training.type] ?? "#555";
  const typeLabel = trainingTypeLabels[training.type] ?? training.type;

  return (
    <Link href={`/trainings/${training.slug}`} className="block">
      <div className="overflow-hidden rounded-lg border border-[#ECECEC] bg-white transition hover:border-primary">
        {/* Image */}
        <div className="relative w-full" style={{ paddingBottom: "56.29%" }}>
          <CoverImage
            src={training.cover}
            alt={training.title}
            className="absolute inset-0 h-full w-full"
          />
        </div>
        {/* Content */}
        <div style={{ padding: "12px 17px 13px" }}>
          {/* Title */}
          <h3
            className="line-clamp-2 font-medium"
            style={{ fontSize: 16, lineHeight: "24px", color: "#222" }}
          >
            {training.title}
          </h3>
          {/* Teacher + type */}
          <div className="mt-[10px] flex items-center justify-between">
            <span style={{ fontSize: 14, color: "#555" }}>
              讲师{training.category?.name ?? ""}
            </span>
            <span style={{ fontSize: 14, color: typeColor }}>
              授课方式：{typeLabel}
            </span>
          </div>
          {/* Divider */}
          <div
            className="mt-[14px]"
            style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }}
          />
          {/* Enroll count + Price */}
          <div className="mt-[11px] flex items-center justify-between">
            <span style={{ fontSize: 14, color: "rgba(0,0,0,0.6)" }}>
              已有{training.enroll_count ?? 232345}人报名
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: training.is_free ? "#FEA500" : "#0F62FE",
              }}
            >
              {formatPrice(training.is_free, training.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Header + Search Section (全宽白底，紧贴导航) ─── */
function HeaderSection() {
  return (
    <section className="w-full bg-white" style={{ paddingTop: 18, paddingBottom: 29 }}>
      <div className="mx-auto max-w-[1200px] px-4">
        <h1
          className="font-bold"
          style={{ fontSize: 40, color: "#222222", lineHeight: "55px" }}
        >
          培训项目
        </h1>
        <p
          className="mt-[9px]"
          style={{ fontSize: 20, color: "rgba(34,34,34,0.6)", lineHeight: "30px" }}
        >
          浏览可报名的线上、线下与混合式培训，查看详情后即可报名。
        </p>
      </div>
    </section>
  );
}

/* ─── Search & Filter Section ─── */
function SearchFilterSection({
  keyword,
  onKeywordChange,
  type,
  onTypeChange,
  category,
  onCategoryChange,
  categories,
}: {
  keyword: string;
  onKeywordChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: Category[];
}) {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-4 pb-[25px]">
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
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="搜索培训项目名称或标题"
            className="flex-1 border-0 bg-transparent px-3 text-sm text-[#222222] outline-none placeholder:text-[#999999]"
            style={{ height: 40 }}
          />
        </div>

        {/* 分类筛选按钮 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            key="all-categories"
            type="button"
            onClick={() => onCategoryChange("all")}
            className="rounded-[6px] text-sm transition-colors"
            style={{
              padding: "7px 15px",
              fontSize: 14,
              background: category === "all" ? "rgba(15, 98, 254, 0.10)" : "transparent",
              color: category === "all" ? "#0F62FE" : "#999999",
              border: `1px solid ${category === "all" ? "#0F62FE" : "#ECECEC"}`,
            }}
          >
            全部领域
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(String(cat.id))}
              className="rounded-[6px] text-sm transition-colors"
              style={{
                padding: "7px 15px",
                fontSize: 14,
                background: category === String(cat.id) ? "rgba(15, 98, 254, 0.10)" : "transparent",
                color: category === String(cat.id) ? "#0F62FE" : "#999999",
                border: `1px solid ${category === String(cat.id) ? "#0F62FE" : "#ECECEC"}`,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 类型筛选下拉 */}
        <div className="mt-3 flex gap-3">
          <Select
            value={type}
            onValueChange={(value) => onTypeChange(value)}
          >
            <SelectTrigger
              className="w-32 rounded-full border-0 bg-[#F5F5F5] px-4"
              aria-label="培训类型"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="online">线上</SelectItem>
              <SelectItem value="offline">线下</SelectItem>
              <SelectItem value="mixed">混合</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

/* ─── Training List Section (仅列表区域) ─── */
function TrainingListSection({
  keyword,
  type,
  category,
  page,
  lastPage,
  items,
  total,
  error,
  loading,
  onKeywordChange,
  onTypeChange,
  onCategoryChange,
  onPageChange,
}: {
  keyword: string;
  type: string;
  category: string;
  page: number;
  lastPage: number;
  items: TrainingCard[];
  total: number;
  error?: string;
  loading: boolean;
  onKeywordChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPageChange: (v: number) => void;
}) {
  return (
    <section style={{ background: "#f6f8fc", paddingTop: 46, paddingBottom: 64 }}>
      <div className="mx-auto max-w-[1200px] px-4">
        {/* 标题 */}
        <h2
          className="font-semibold"
          style={{ fontSize: 24, color: "#222222", lineHeight: "28px" }}
        >
          全部培训{" "}
          <span style={{ fontSize: 14, color: "#0F62FE" }}>
            (共{total})
          </span>
        </h2>

        {/* 列表内容 */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="加载培训列表" />
            </div>
          ) : null}
          {!loading && error ? (
            <EmptyState title="无法加载培训" description={error} />
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <EmptyState title="暂无培训项目" description="试试更换关键词或筛选条件。" />
          ) : null}
          {!loading && !error && items.length > 0 ? (
            <>
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                style={{ columnGap: 16, rowGap: 16 }}
              >
                {items.map((training) => (
                  <TrainingCardItemStyled key={training.id} training={training} />
                ))}
              </div>
              <div className="mt-6">
                <Pagination page={page} lastPage={lastPage} loading={loading} onPageChange={onPageChange} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Component ─── */
export function TrainingListHeader({
  keyword,
  type,
  category,
  categories,
  onKeywordChange,
  onTypeChange,
  onCategoryChange,
}: {
  keyword: string;
  type: string;
  category: string;
  categories: Category[];
  onKeywordChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}) {
  return (
    <>
      <HeaderSection />
      <SearchFilterSection
        keyword={keyword}
        onKeywordChange={onKeywordChange}
        type={type}
        onTypeChange={onTypeChange}
        category={category}
        onCategoryChange={onCategoryChange}
        categories={categories}
      />
    </>
  );
}

export function TrainingListContent(props: {
  keyword: string;
  type: string;
  category: string;
  page: number;
  lastPage: number;
  items: TrainingCard[];
  total: number;
  error?: string;
  loading: boolean;
  onKeywordChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPageChange: (v: number) => void;
}) {
  return <TrainingListSection {...props} />;
}

export function TrainingListView() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [items, setItems] = useState<TrainingCard[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const apiType = type === "all" ? undefined : type;
  const apiCategory = category === "all" ? undefined : category;

  // Fetch list on mount; extract categories from response
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getTrainings({
        q: keyword.trim() || undefined,
        type: apiType,
        category: apiCategory,
        page,
        per_page: 16,
      })
        .then((result) => {
          if (cancelled) return;
          setItems(result.data.data);
          setTotal(result.data.total);
          setLastPage(result.data.last_page ?? 1);
          setError(undefined);
          // Extract categories from list data (only on first page / no filters)
          if (page === 1 && !apiType && !keyword.trim()) {
            const seen = new Map<number, Category>();
            result.data.data.forEach((t) => {
              if (t.category && !seen.has(t.category.id)) {
                seen.set(t.category.id, t.category);
              }
            });
            setCategories(Array.from(seen.values()));
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(getApiErrorMessage(err, "培训列表加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, apiType, apiCategory, page]);

  const handleKeywordChange = (v: string) => { setKeyword(v); setPage(1); };
  const handleTypeChange = (v: string) => { setType(v); setPage(1); };
  const handleCategoryChange = (v: string) => { setCategory(v); setPage(1); };

  return (
    <div>
      <TrainingListHeader
        keyword={keyword}
        type={type}
        category={category}
        categories={categories}
        onKeywordChange={handleKeywordChange}
        onTypeChange={handleTypeChange}
        onCategoryChange={handleCategoryChange}
      />
      <TrainingListSection
        keyword={keyword}
        type={type}
        category={category}
        page={page}
        lastPage={lastPage}
        items={items}
        total={total}
        error={error}
        loading={loading}
        onKeywordChange={handleKeywordChange}
        onTypeChange={handleTypeChange}
        onCategoryChange={handleCategoryChange}
        onPageChange={setPage}
      />
    </div>
  );
}
