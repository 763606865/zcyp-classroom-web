"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { TeacherProfile } from "@/entities/classroom";
import { UserAvatar, avatarImageSrc } from "@/features/user/user-avatar";
import { getApiErrorMessage } from "@/lib/forms";
import { getTeachers } from "./api";
import { stripHtml } from "./labels";
import { fallbackTeachers } from "./marketing";
import { teacherTopicMock } from "./topic-mock";
import { TopicChip, TopicHero, TopicSection } from "./topic-chrome";
import { TopicPager } from "./topic-pager";

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
      void getTeachers({ q: keyword.trim() || (domain === "all" ? undefined : domain), page })
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

  const chief = items[0];
  const rest = items.slice(1);
  const portraits = useMemo(
    () => items.slice(0, 3).map((item) => item.name),
    [items],
  );

  return (
    <div>
      <TopicHero
        title="师资力量"
        subtitle={teacherTopicMock.heroSubtitle}
        stats={teacherTopicMock.stats}
        aside={
          <div className="flex items-center justify-center py-4">
            {(portraits.length > 0 ? portraits : fallbackTeachers.slice(0, 3).map((item) => item.name)).map((name, index) => (
              <UserAvatar
                key={`${name}-${index}`}
                name={name}
                className={`size-24 border-4 border-primary text-2xl ${index > 0 ? "-ml-6" : ""}`}
              />
            ))}
          </div>
        }
      />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4">
          <Input
            value={keyword}
            onChange={(event) => { setKeyword(event.target.value); setDomain("all"); setPage(1); }}
            placeholder="搜索姓名、头衔、单位或擅长领域"
            aria-label="搜索师资"
            className="sm:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <TopicChip active={domain === "all"} onClick={() => { setDomain("all"); setPage(1); }}>全部领域</TopicChip>
            {teacherTopicMock.domains.map((item) => (
              <TopicChip key={item} active={domain === item} onClick={() => { setDomain(item); setKeyword(""); setPage(1); }}>{item}</TopicChip>
            ))}
          </div>
        </div>
      </div>
      {chief ? (
        <TopicSection title="首席讲师">
          <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <UserAvatar name={chief.name} src={avatarImageSrc(chief.avatar)} className="size-28 text-3xl" />
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold">{chief.name}</h3>
              <p className="mt-1 text-primary">{chief.title ?? "讲师"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{[chief.organization, chief.expertise].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {teacherTopicMock.chiefTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary">{tag}</span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{stripHtml(chief.bio) || teacherTopicMock.chiefBio}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/teachers/${chief.id}`} className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">查看详情</Link>
                <Link href={`/consult?source=teacher&teacher=${chief.id}`} className="inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">预约试听</Link>
              </div>
            </div>
          </Card>
        </TopicSection>
      ) : null}
      <TopicSection title="全部师资">
        {loading ? <div className="flex justify-center py-16"><Spinner label="加载师资力量" /></div> : null}
        {!loading && error ? <EmptyState title="无法加载师资" description={error} /> : null}
        {!loading && !error && items.length === 0 ? <EmptyState title="没有匹配的讲师" description="试试更换关键词。" /> : null}
        {!loading && !error && items.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">共 {total} 位讲师</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(rest.length > 0 ? rest : items).map((teacher) => (
                <Link key={teacher.id} href={`/teachers/${teacher.id}`} className="block h-full">
                  <Card className="flex h-full flex-col items-center p-6 text-center transition hover:border-primary">
                    <UserAvatar name={teacher.name} src={avatarImageSrc(teacher.avatar)} className="size-20 text-xl" />
                    <h2 className="mt-4 text-lg font-semibold">{teacher.name}</h2>
                    <p className="mt-1 text-sm text-primary">{teacher.title ?? "讲师"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{teacher.expertise}</p>
                    {stripHtml(teacher.bio) ? <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{stripHtml(teacher.bio)}</p> : null}
                    <span className="mt-4 text-sm font-medium text-primary">查看讲师</span>
                  </Card>
                </Link>
              ))}
            </div>
            <TopicPager page={page} lastPage={lastPage} loading={loading} onPageChange={setPage} />
          </>
        ) : null}
      </TopicSection>
      <TopicSection title="授课方式">
        <div className="grid gap-3 md:grid-cols-3">
          {teacherTopicMock.methods.map((item) => (
            <Card key={item.title} className="p-5">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </TopicSection>
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2">
            {teacherTopicMock.quotes.map((item) => (
              <Card key={item.name} className="p-5">
                <p className="text-sm leading-7">{item.text}</p>
                <p className="mt-3 text-sm text-muted-foreground">—— {item.name}</p>
              </Card>
            ))}
          </div>
          <Link href="/consult?source=faculty" className="flex min-h-32 flex-col justify-center rounded-2xl bg-accent p-6 text-white">
            <p className="text-xl font-semibold">预约试听</p>
            <p className="mt-2 text-sm text-white/85">教务老师会协助匹配讲师与班级</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
