"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ClassroomHome, Teacher, TrainingCard } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { getClassroomHome } from "./api";
import { HomeSideDock } from "./home-lead";
import { formatDate, formatPrice, trainingTypeLabels } from "./labels";
import {
  campuses,
  fallbackTeachers,
  faqs,
  instituteReports,
  partners,
  popularCourseFallbacks,
  studentReports,
  valuePoints,
} from "./marketing";

function SectionTitle({ title, subtitle, light = false }: { title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="mb-8 text-center">
      <h2 className={`text-3xl font-semibold tracking-tight ${light ? "text-white" : ""}`}>{title}</h2>
      {subtitle ? <p className={`mt-2 text-sm ${light ? "text-white/80" : "text-muted-foreground"}`}>{subtitle}</p> : null}
    </div>
  );
}

export function ClassroomHomeView() {
  const { siteName, settings } = useSystemSettings();
  const [home, setHome] = useState<ClassroomHome>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [teacherIndex, setTeacherIndex] = useState(0);
  const [partnerTab, setPartnerTab] = useState<"companies" | "universities">("companies");
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getClassroomHome()
      .then((result) => {
        if (!cancelled) setHome(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "部分首页数据暂未加载"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const banners = home?.banners ?? [];
  const banner = banners[bannerIndex] ?? banners[0];
  const trainings: TrainingCard[] = home?.featured_trainings?.length
    ? home.featured_trainings
    : home?.latest_trainings ?? [];
  const courses = useMemo(() => home?.featured_courses ?? [], [home]);

  const teachers = useMemo(() => {
    const fromApi: Teacher[] = [];
    for (const course of courses) {
      if (course.teacher && !fromApi.some((item) => item.id === course.teacher?.id)) {
        fromApi.push(course.teacher);
      }
    }
    if (fromApi.length > 0) return fromApi;
    return fallbackTeachers.map((item, index) => ({
      id: index + 1,
      name: item.name,
      title: item.title,
      avatar: null,
      organization: siteName,
      expertise: item.expertise,
    }));
  }, [courses, siteName]);

  const visibleTeachers = teachers.slice(teacherIndex, teacherIndex + 3);
  const courseCards = courses.length > 0
    ? courses.slice(0, 12).map((course) => ({ title: course.title, subtitle: course.summary ?? course.teacher?.name ?? "岗位能力课程" }))
    : popularCourseFallbacks;

  return (
    <div id="top" className="bg-background">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-accent">选择{siteName}，提升核心竞争力</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {banner?.title ?? `${siteName} · 计量检测岗位培训`}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-white/80">
              {banner?.summary ?? banner?.subtitle ?? "公开课、线下班与混合式培训一体，从报名、学习到考试形成完整闭环。"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trainings"><Button variant="accent">浏览培训项目</Button></Link>
              <Link href="/consult?source=homepage"><Button className="border-white/40 bg-white text-primary hover:bg-white/90">免费试听</Button></Link>
            </div>
          </div>
          <CoverImage src={banner?.cover} alt="" className="min-h-64 w-full rounded-2xl bg-white/10" />
        </div>
        {banners.length > 1 ? (
          <div className="mx-auto flex max-w-6xl justify-center gap-2 px-6 pb-8">
            {banners.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`切换到 ${item.title}`}
                onClick={() => setBannerIndex(index)}
                className={`size-2.5 rounded-full ${index === bannerIndex ? "bg-accent" : "bg-white/50"}`}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section id="courses" className="scroll-mt-24 bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title="热门课程" subtitle="覆盖计量、检测、体系与数字化方向，可按岗位选课。" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courseCards.map((course) => (
              <Card key={course.title} className="border-primary/10 text-center">
                <div className="mx-auto mb-3 size-12 rounded-full bg-primary/10 text-lg font-semibold leading-[3rem] text-primary">测</div>
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{course.subtitle}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/trainings"><Button variant="accent">免费咨询课程</Button></Link>
          </div>
        </div>
      </section>

      <section id="news" className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title="资讯中心" subtitle="开班动态、行业要点与岗位能力资讯。" light />
          <div className="grid gap-4 lg:grid-cols-3">
            {(banners.slice(0, 2).length > 0 ? banners.slice(0, 2) : [
              { id: 1, title: "新一期计量员培训即将开班", summary: "面向在岗与转岗人员，含法规与实操模块。", cover: null },
              { id: 2, title: "实验室认可专题更新", summary: "围绕内审、管理评审与不符合项整改。", cover: null },
            ]).map((item) => (
              <Card key={item.id} className="overflow-hidden p-0">
                <CoverImage src={item.cover} alt="" className="h-36 w-full" />
                <div className="p-5 text-foreground">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>
              </Card>
            ))}
            <Card className="bg-accent text-white">
              <p className="text-sm font-medium">本月开班计划</p>
              <ul className="mt-4 grid gap-2 text-sm">
                {(trainings.slice(0, 4).length > 0 ? trainings.slice(0, 4) : popularCourseFallbacks.slice(0, 4)).map((item) => (
                  <li key={item.title}>{item.title}</li>
                ))}
              </ul>
              <Link href="/#schedule" className="mt-6 inline-block text-sm underline">查看全部</Link>
            </Card>
          </div>
        </div>
      </section>

      <section id="schedule" className="scroll-mt-24 bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title="开班计划" subtitle="近期可报名的培训项目，支持线上直播与线下面授。" />
          {loading ? (
            <div className="flex justify-center py-10"><Spinner label="加载开班计划" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">培训项目</th>
                    <th className="px-4 py-3 font-medium">形式</th>
                    <th className="px-4 py-3 font-medium">开班日期</th>
                    <th className="px-4 py-3 font-medium">地点</th>
                    <th className="px-4 py-3 font-medium">费用</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(trainings.length > 0 ? trainings : []).map((training) => (
                    <tr key={training.id} className="border-t border-border bg-surface">
                      <td className="px-4 py-3 font-medium">{training.title}</td>
                      <td className="px-4 py-3">{trainingTypeLabels[training.type] ?? training.type}</td>
                      <td className="px-4 py-3">{formatDate(training.start_at)}</td>
                      <td className="px-4 py-3">{training.location ?? "全国"}</td>
                      <td className="px-4 py-3">{formatPrice(training.is_free, training.price)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/trainings/${training.slug}`}><Button variant="accent" className="h-8 min-h-8 px-3 text-xs">报名 / 试听</Button></Link>
                      </td>
                    </tr>
                  ))}
                  {trainings.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>{error ?? "暂无公开开班计划，可先提交咨询。"}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section id="faculty" className="scroll-mt-24 bg-background py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title="师资力量" subtitle={`${siteName}讲师来自计量检测一线，兼顾标准解读与现场实操。`} />
          <div className="relative">
            <div className="grid gap-4 md:grid-cols-3">
              {(visibleTeachers.length > 0 ? visibleTeachers : teachers).map((teacher) => {
                const fallback = fallbackTeachers.find((item) => item.name === teacher.name);
                return (
                  <Card key={teacher.id} className="text-center">
                    <div className="mx-auto mb-4 size-24 overflow-hidden rounded-full bg-muted">
                      <CoverImage src={teacher.avatar} alt="" className="size-24" />
                    </div>
                    <h3 className="text-lg font-semibold">{teacher.name}</h3>
                    <p className="mt-1 text-sm text-primary">{teacher.title ?? "讲师"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{teacher.expertise ?? fallback?.expertise}</p>
                    <ul className="mt-4 space-y-1 text-left text-sm text-muted-foreground">
                      {(fallback?.highlights ?? ["一线授课经验", "岗位案例教学", "考核要点辅导"]).map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                    <Link href="/consult?source=faculty" className="mt-6 inline-block w-full"><Button variant="accent" className="w-full">预约试听</Button></Link>
                  </Card>
                );
              })}
            </div>
            {teachers.length > 3 ? (
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="secondary" onClick={() => setTeacherIndex((index) => Math.max(0, index - 1))}>上一组</Button>
                <Button variant="secondary" onClick={() => setTeacherIndex((index) => Math.min(teachers.length - 3, index + 1))}>下一组</Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">选择{siteName} 提升核心竞争力</h2>
            <p className="mt-3 text-white/80">以岗位能力为目标，把标准、仪器与现场作业串成可落地的培训路径。</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {["标准授课", "真机实训", "考核辅导", "企业内训"].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 px-4 py-8 text-center font-medium">{item}</div>
              ))}
            </div>
          </div>
          <ol className="grid gap-3">
            {valuePoints.map((item) => (
              <li key={item.index} className="flex gap-4 rounded-lg bg-white/10 p-4">
                <span className="text-accent font-semibold">{item.index}</span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-white/75">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title={`${siteName}战报`} subtitle="学员成果与机构动态，持续更新。" />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-0">
              <h3 className="rounded-t-xl bg-primary px-5 py-3 font-medium text-primary-foreground">学员战报</h3>
              <ul className="space-y-3 p-5 text-sm leading-6">
                {studentReports.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </Card>
            <Card className="p-0">
              <h3 className="rounded-t-xl bg-primary px-5 py-3 font-medium text-primary-foreground">机构战报</h3>
              <ul className="space-y-3 p-5 text-sm leading-6">
                {instituteReports.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Link href="/trainings"><Button variant="accent">了解更多</Button></Link>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title="常见问题" subtitle="备考深造与岗位提升路上，这些是学员问得最多的问题。" light />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.q} className="flex items-center justify-between gap-3 rounded-full bg-white px-4 py-3 text-foreground">
                <p className="text-sm font-medium">{item.q}</p>
                <Link href="/consult?source=faq"><Button variant="accent" className="h-8 min-h-8 shrink-0 rounded-full px-3 text-xs">咨询</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title={`${siteName}校区`} subtitle="一线学习，全国联合。" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campuses.map((campus) => (
              <Card key={campus.city} className="overflow-hidden p-0">
                <h3 className="bg-accent px-5 py-3 font-medium text-white">{campus.city}</h3>
                <div className="p-5">
                  <p className="text-lg font-semibold text-primary">{settings?.customer_service_phone ?? "400-000-0000"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{campus.address}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle title="合作伙伴" subtitle="联合检测机构、院校与企业，共建培训与实训。" />
          <div className="mb-6 flex justify-center gap-6 text-sm">
            <button type="button" className={partnerTab === "companies" ? "font-semibold text-primary" : "text-muted-foreground"} onClick={() => setPartnerTab("companies")}>合作企业</button>
            <button type="button" className={partnerTab === "universities" ? "font-semibold text-primary" : "text-muted-foreground"} onClick={() => setPartnerTab("universities")}>合作高校</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {partners[partnerTab].map((name) => (
              <div key={name} className="rounded-xl border border-border bg-surface px-3 py-8 text-center text-sm">{name}</div>
            ))}
          </div>
        </div>
      </section>

      <HomeSideDock />
    </div>
  );
}
