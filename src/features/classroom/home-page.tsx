"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Button } from "@/components/ui/button";
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
  popularCourseFallbacks,
  studentReports,
  valuePoints,
} from "./marketing";

// ==================== 通用组件 ====================

function SectionHeader({
  title,
  subtitle,
  linkHref,
  linkText = "查看更多",
  centered = false,
}: {
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkText?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <div className="text-center">
        <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">{title}</h2>
        {subtitle && <p className="mt-[9px] text-[14px] text-black/60">{subtitle}</p>}
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-[24px] leading-[28px] font-semibold text-[#222222]">{title}</h2>
      {subtitle && (
        <div className="mt-[9px] flex items-center justify-between">
          <p className="text-[14px] text-black/60">{subtitle}</p>
          {linkHref && (
            <Link
              href={linkHref}
              className="inline-flex shrink-0 items-center gap-[4px] rounded-[3px] border border-[#DCDCDC] px-[8px] py-[4px] text-[12px] text-[#0F62FE] hover:bg-primary/5"
            >
              {linkText}
              <Image src="/images/home/more-icon.png" alt="" width={16} height={16} />
            </Link>
          )}
        </div>
      )}
      {!subtitle && linkHref && (
        <div className="mt-[9px] flex justify-end">
          <Link
            href={linkHref}
            className="inline-flex items-center gap-[4px] rounded-[3px] border border-[#DCDCDC] px-[8px] py-[4px] text-[12px] text-[#0F62FE] hover:bg-primary/5"
          >
            {linkText}
            <Image src="/images/home/more-icon.png" alt="" width={16} height={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ==================== Banner 区 ====================

function BannerSection({ banners, siteName }: { banners: ClassroomHome["banners"]; siteName: string }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const banner = banners[bannerIndex] ?? banners[0];

  // 第二行文字按 "·" 分割着色
  const titleText = banner?.title ?? `${siteName}·计量检测岗位培训`;
  const titleParts = titleText.split("·");
  const titleFirst = titleParts[0];
  const titleSecond = titleParts.length > 1 ? `·${titleParts.slice(1).join("·")}` : "";

  return (
    <section className="relative overflow-visible" style={{ height: 557 }}>
      {/* 背景图：底部对齐，顶部溢出78px */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: 557 }}>
        <Image
          src="/images/home/banner-bg.png"
          alt=""
          width={1440}
          height={557}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {/* 内容区：高度479px，靠底部对齐 */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: 479 }}>
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-[16px]">
          {/* 左侧文字区 */}
          <div className="flex-1">
            <p className="text-[20px] leading-[44px] font-medium text-[#FEA501]">
              选择中测培训 提升核心精准力
            </p>
            <h1 className="mt-[16px] text-[40px] leading-[44px] font-bold">
              <span className="text-[#222222]">{titleFirst}</span>
              <span className="text-[#0F62FE]">{titleSecond}</span>
            </h1>
            <p className="mt-[24px] text-[20px] leading-[30px] text-[#222222]/60">
              {banner?.summary ?? banner?.subtitle ?? "公开课、线下班与混合式培训一体，从报名、学习到考试形成完整闭环。"}
            </p>
            <div className="mt-[75px] flex gap-[16px]">
              <Link href="/trainings">
                <Button
                  className="flex h-[40px] w-[136px] min-h-[40px] items-center justify-center gap-[4px] rounded-md text-sm"
                  style={{ background: "#0F62FE" }}
                >
                  <Image src="/images/home/banner-btn.png" alt="" width={16} height={16} />
                  浏览培训项目
                </Button>
              </Link>
              <Link href="/consult?source=homepage">
                <Button className="flex h-[40px] w-[136px] min-h-[40px] items-center justify-center rounded-md border text-sm"
                  style={{ background: "transparent", borderColor: "#0F62FE", color: "#0F62FE" }}
                >
                  免费试听
                </Button>
              </Link>
            </div>
          </div>

          {/* 右侧图片 */}
          <div className="shrink-0">
            <Image
              src={banner?.cover ?? "/images/home/banner-img.png"}
              alt={banner?.title ?? "Banner"}
              width={681}
              height={384}
              className="h-auto w-[681px] object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Banner 指示器 */}
      {banners.length > 1 && (
        <div className="absolute bottom-[20px] left-1/2 flex -translate-x-1/2 gap-2">
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
      )}
    </section>
  );
}

// ==================== 热门课程区 ====================

function HotCoursesSection({ courses }: { courses: ClassroomHome["featured_courses"] }) {
  const courseCards = courses.length > 0 ? courses.slice(0, 8) : popularCourseFallbacks.slice(0, 8);

  return (
		<section className="bg-white py-[71px]" style={{ paddingBottom: 79 }}>
			<div className="mx-auto max-w-[1200px]">
				<SectionHeader
					title="热门课程"
					subtitle="覆盖计量、检测、体系与数字化方向，可按岗位选课。"
					linkHref="/courses"
					linkText="查看更多"
				/>

				<div className="mt-[29px] grid grid-cols-1 gap-x-[18px] gap-y-[24px] sm:grid-cols-2 lg:grid-cols-4">
					{courses.length > 0
						? courses.slice(0, 8).map(course => (
								<Link
									key={course.id}
									href={`/courses/${course.slug}`}
									className="group border border-[#ECECEC] rounded-[8px]"
								>
									<div className="overflow-hidden rounded-t-[8px] bg-muted">
										{course.cover ? (
											<CoverImage
												src={course.cover}
												alt={course.title}
												className="h-[161px] w-full"
											/>
										) : (
											<div className="flex h-[161px] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
												<span className="text-4xl font-bold text-primary/30">
													测
												</span>
											</div>
										)}
									</div>
									<div className="rounded-b-lg bg-surface p-[12px] pr-[15px] pb-[11px] pl-[15px]">
										<h3 className="line-clamp-2 text-[16px] font-medium text-[#222222] group-hover:text-primary">
											{course.title}
										</h3>
										<p className="mt-[10px] text-[14px] text-[#555555]">
											{course.teacher?.name ?? ''}
										</p>
										<div className="mt-[4px] h-[1px] bg-black/10" />
										<div className="mt-[11px] flex items-center justify-between">
											<span className="text-[14px] text-black/60">
												已有{Number(course.enroll_count ?? 0)}人报名
											</span>
											<span
												className={`text-[16px] font-semibold ${course.is_free ? 'text-[#FEA500]' : 'text-[#0F62FE]'}`}
											>
												{formatPrice(course.is_free, course.price)}
											</span>
										</div>
									</div>
								</Link>
							))
						: popularCourseFallbacks.slice(0, 8).map((course, idx) => (
								<Link key={idx} href="/courses" className="group">
									<div className="overflow-hidden rounded-t-[8px] bg-muted">
										<div className="flex h-[161px] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
											<span className="text-4xl font-bold text-primary/30">
												测
											</span>
										</div>
									</div>
									<div className="rounded-b-lg bg-surface p-[12px] pr-[15px] pb-[11px] pl-[15px]">
										<h3 className="line-clamp-2 text-[16px] font-medium text-[#222222] group-hover:text-primary">
											{course.title}
										</h3>
										<p className="mt-[10px] text-[14px] text-[#555555]">
											{course.subtitle}
										</p>
										<div className="mt-[4px] h-[1px] bg-black/10" />
										<div className="mt-[11px] flex items-center justify-between">
											<span className="text-[14px] text-black/60">
												已有232345人报名
											</span>
											<span className="text-[16px] font-semibold text-[#0F62FE]">
												¥2345
											</span>
										</div>
									</div>
								</Link>
							))}
				</div>
			</div>
		</section>
  );
}

// ==================== 资讯中心区 ====================

function NewsSection({ trainings }: { trainings: TrainingCard[] }) {
  const newsItems = trainings.length > 0 ? trainings.slice(0, 6) : [];
  const featuredItem = newsItems[0];

  return (
    <section className="py-[54px]" style={{ background: "#f6f8fc", paddingBottom: 73 }}>
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="资讯中心"
          subtitle="开班动态、行业要点与岗位能力资讯。"
          linkHref="/consult"
          linkText="查看更多"
        />

        <div className="mt-[29px] flex gap-[25px] lg:flex-row flex-col">
          {/* 左侧大图 */}
          <div className="relative shrink-0 rounded-lg">
            <Image
              src="/images/home/box1-img.png"
              alt="资讯中心"
              width={622}
              height={350}
              className="h-auto w-[622px] object-cover z-10 relative"
            />
            {/* 左下角蓝色矩形 - 层级低于图片文字 */}
            <div
              className="absolute z-0"
              style={{
                left: -10,
                bottom: -8,
                width: 224,
                height: 128,
                background: "#3370FF",
                zIndex: 1,
              }}
            />
            {/* 图上文字覆盖层 */}
            {featuredItem && (
              <div className="absolute bottom-[22px] left-0 right-0 z-10 px-[26px]">
                <div className="flex items-center justify-between">
                  <p className="text-[16px] font-[500] text-white">{featuredItem.title}</p>
                  <span className="shrink-0 ml-4 text-[14px] text-white/80">
                    {formatDate(featuredItem.start_at)}
                  </span>
                </div>
                <p className="mt-[5px] text-[14px] font-[400] leading-relaxed text-white/80">
                  {featuredItem.summary ?? "面向在岗与转岗人员，含法规与实操模块。"}
                </p>
              </div>
            )}
          </div>

          {/* 右侧列表 - 白色背景卡片 */}
          <div className="flex-1 overflow-hidden rounded-[6px] bg-white" style={{ boxShadow: "0px 1px 4px 0px rgba(0,0,0,0.1)" }}>
            {newsItems.length > 0 ? (
              <div className="pt-[12px] pr-[24px] pb-[18px] pl-[24px]">
                {newsItems.map((item) => (
                  <Link
                    key={item.id}
                    href="/consult"
                    className="flex items-center gap-[14px] border-b border-[#E7E7E7] py-[12px] hover:bg-gray-50 transition-colors"
                    style={{ minHeight: 54 }}
                  >
                    <Image
                      src="/images/home/box1-icon.png"
                      alt=""
                      width={24}
                      height={24}
                      className="shrink-0"
                    />
                    <span className="flex-1 truncate text-[14px] text-[#222222]">{item.title}</span>
                    <span className="shrink-0 text-[14px] text-black/60">
                      {formatDate(item.start_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
                暂无资讯数据
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== 开班计划区 ====================

function ScheduleSection({ trainings, loading, error }: { trainings: TrainingCard[]; loading: boolean; error?: string }) {
  return (
    <section className="bg-white py-[72px]" style={{ paddingBottom: 41 }}>
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="开班计划"
          subtitle="近期可报名的培训项目，支持线上直播与线下面授。"
          linkHref="/schedule"
          linkText="查看更多开班计划"
        />

        <div className="mt-[29px] overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead style={{ background: "#f1f5fc" }}>
              <tr>
                <th className="px-4 py-3 font-medium text-[#222222]">培训项目</th>
                <th className="px-4 py-3 font-medium text-[#222222]">形式</th>
                <th className="px-4 py-3 font-medium text-[#222222]">开班日期</th>
                <th className="px-4 py-3 font-medium text-[#222222]">地点</th>
                <th className="px-4 py-3 font-medium text-[#222222]">费用</th>
                <th className="px-4 py-3 font-medium text-[#222222]">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : trainings.length > 0 ? (
                trainings.map((training) => (
                  <tr key={training.id} className="border-t border-border bg-surface">
                    <td className="px-4 py-3 font-medium">{training.title}</td>
                    <td className="px-4 py-3">{trainingTypeLabels[training.type] ?? training.type}</td>
                    <td className="px-4 py-3">{formatDate(training.start_at)}</td>
                    <td className="px-4 py-3">{training.location ?? "全国"}</td>
                    <td className="px-4 py-3">{formatPrice(training.is_free, training.price)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/trainings/${training.slug}`} className="text-[14px] text-[#0F62FE] hover:underline">
                        报名 / 试听
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {error ?? "暂无公开开班计划，可先提交咨询。"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ==================== 师资力量区 ====================

function FacultySection({ teachers }: { teachers: Teacher[] }) {
  const visibleTeachers = teachers.slice(0, 3);

  return (
    <section
      className="py-[68px]"
      style={{
        background: "linear-gradient(134deg, #0039A5 0%, #0F62FE 55%, #2462C4 100%)",
        paddingBottom: 64,
      }}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center">
          <h2 className="text-[24px] leading-[28px] font-semibold text-[#FDFDFD]">师资力量</h2>
          <p className="mt-[11px] text-[14px] text-[#FDFDFD]">
            中测培训讲师来自计量检测一线，兼顾标准解读与现场实操。
          </p>
        </div>

        <div className="mt-[24px] grid grid-cols-1 gap-4 md:grid-cols-3">
          {visibleTeachers.map((teacher) => {
            const fallback = fallbackTeachers.find((item) => item.name === teacher.name);
            return (
				<div key={teacher.id} className="rounded-lg bg-white p-6">
					<div className="flex items-start gap-4">
						<div className="size-[72px] shrink-0 overflow-hidden rounded-full bg-muted">
							<CoverImage
								src={teacher.avatar}
								alt={teacher.name}
								className="size-[72px]"
							/>
						</div>
						<div className="flex-1">
							<div className="flex items-start justify-between">
								<h3 className="text-[22px] font-semibold text-[#222222]">
									{teacher.name}
								</h3>
								<Link
									href={`/teachers/${teacher.id}`}
									className="inline-flex items-center gap-[4px] text-[12px] text-[#0F62FE] hover:underline"
								>
									查看讲师主页
									<Image
										src="/images/home/more-icon.png"
										alt=""
										width={16}
										height={16}
									/>
								</Link>
							</div>
							<p className="mt-1 text-[14px] text-black/60">
								{teacher.title ?? '讲师'}
							</p>
							<p className="mt-2 text-[14px] text-black/60">
								{teacher.expertise ?? fallback?.expertise}
							</p>
						</div>
					</div>
					<div className="mt-4 flex flex-wrap gap-2">
						{(
							fallback?.highlights ?? ['一线授课经验', '岗位案例教学', '考核要点辅导']
						).map(tag => (
							<span
								key={tag}
								className="rounded-full px-3 py-1 text-[14px]"
								style={{ background: '#EAF1FC', color: '#0F62FE' }}
							>
								{tag}
							</span>
						))}
					</div>
				</div>
			);
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/teachers">
            <Button className="border border-white/40 bg-transparent text-white hover:bg-white/10">
              查看全部师资 →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==================== 为什么选择中测培训区 ====================

const whyChooseLabels = [
  { icon: "/images/home/box2-icon1.png", text: "标准授课" },
  { icon: "/images/home/box2-icon2.png", text: "真机实训" },
  { icon: "/images/home/box2-icon3.png", text: "考核辅导" },
  { icon: "/images/home/box2-icon4.png", text: "企业内训" },
];

const tagCards = valuePoints.map((point, idx) => ({
  ...point,
  icon: `/images/home/box2-img${idx + 1}.png`,
}));

function WhyChooseSection() {
  return (
    <section className="py-[72px]" style={{ background: "#f6f8fc", paddingBottom: 62 }}>
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="为什么选择中测培训"
          subtitle="以岗位能力为目标，把标准、仪器与现场作业串成可落地的培训路径。"
        />

        {/* 4个label */}
        <div className="mt-[22px] flex flex-wrap gap-[12px]">
          {whyChooseLabels.map((label) => (
            <div
              key={label.text}
              className="inline-flex items-center rounded-[50px] bg-white px-[13px] py-[6px]"
            >
              <Image src={label.icon} alt="" width={24} height={24} className="shrink-0" />
              <span className="ml-[10px] text-[14px] text-[#222222]">{label.text}</span>
            </div>
          ))}
        </div>

        {/* 6个标签卡片 */}
        <div className="mt-[34px] grid grid-cols-1 gap-x-[22px] gap-y-[16px] sm:grid-cols-2 lg:grid-cols-3">
          {tagCards.map((card) => (
            <div
              key={card.index}
              className="rounded-[8px] bg-white p-[23px] pr-[16px] pb-[21px] pl-[16px] shadow-[0_2px_6px_0_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-start gap-[8px]">
                <Image
                  src={card.icon}
                  alt=""
                  width={56}
                  height={56}
                  className="shrink-0"
                />
                <div>
                  <p className="text-[18px] font-semibold text-[#222222]">{card.title}</p>
                  <p className="mt-[6px] text-[14px] text-black/60">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== 培训战报区 ====================

function ReportsSection() {
  return (
    <section className="bg-white py-[72px]" style={{ paddingBottom: 84 }}>
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="中测培训战报"
          subtitle="备考深造与岗位提升路上，这些是学员问得最多的问题。"
          centered
        />

        <div className="mt-[29px] grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 学员战报 */}
          <div
            className="rounded-[12px] p-5"
            style={{
              background: "linear-gradient(180deg, #EBF2FF 0%, #FFFFFF 100%)",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)",
              border: "1px solid #EBF2FF",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-[#222222]">学员战报</h3>
              <Link href="/trainings" className="inline-flex items-center gap-[4px] text-[12px] text-[#0F62FE] hover:underline">
                查看更多战报
                <Image src="/images/home/more-icon.png" alt="" width={16} height={16} />
              </Link>
            </div>
            <ul className="space-y-[18px]">
              {studentReports.map((item, idx) => (
                <li key={idx} className="flex items-start gap-[16px]">
                  <Image
                    src="/images/home/box3-icon.png"
                    alt=""
                    width={30}
                    height={30}
                    className="shrink-0"
                  />
                  <span className="text-[14px] leading-relaxed text-[#222222]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 机构战报 */}
          <div
            className="rounded-[12px] p-5"
            style={{
              background: "linear-gradient(180deg, #FFF0F0 0%, #FFFFFF 100%)",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)",
              border: "1px solid #FFF1F0",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-[#222222]">机构战报</h3>
              <Link href="/trainings" className="inline-flex items-center gap-[4px] text-[12px] text-[#0F62FE] hover:underline">
                查看更多战报
                <Image src="/images/home/more-icon.png" alt="" width={16} height={16} />
              </Link>
            </div>
            <ul className="space-y-[18px]">
              {instituteReports.map((item, idx) => (
                <li key={idx} className="flex items-start gap-[16px]">
                  <Image
                    src="/images/home/box3-icon.png"
                    alt=""
                    width={30}
                    height={30}
                    className="shrink-0"
                  />
                  <span className="text-[14px] leading-relaxed text-[#222222]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== 常见问题区 ====================

function FAQSection() {
  return (
    <section className="py-[52px]" style={{ background: "#f6f8fc", paddingBottom: 82 }}>
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="常见问题"
          subtitle="备考深造与岗位提升路上，这些是学员问得最多的问题。"
          centered
        />

        <div className="mt-[29px] rounded-lg bg-white p-5">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={idx < faqs.length - 1 ? "border-b border-[#E3EAF4] py-5" : "py-5"}
            >
              <div className="flex items-start gap-3">
                <Image
                  src="/images/home/box4-icon1.png"
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
                  <Image src="/images/home/more-icon.png" alt="" width={16} height={16} />
                </Link>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <Image
                  src="/images/home/box4-icon2.png"
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
      </div>
    </section>
  );
}

// ==================== 中测培训校区区 ====================

function CampusSection({ phone }: { phone?: string | null }) {
  return (
    <section className="bg-white py-[72px]" style={{ paddingBottom: 77 }}>
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="中测培训校区"
          subtitle="一线学习，全国联合。"
        />

        <div className="mt-[29px] grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campuses.map((campus) => (
            <div
              key={campus.city}
              className="rounded-[8px] p-[15px] pr-[20px] pb-[18px] pl-[20px]"
              style={{ background: "#F7F7F7" }}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/images/home/box5-icon1.png"
                  alt=""
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <h3 className="text-[16px] font-semibold text-[#222222]">{campus.city}</h3>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Image
                  src="/images/home/box5-icon2.png"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <p className="text-[14px] text-[#0F62FE]">{phone ?? "400-000-0000"}</p>
              </div>
              <div className="mt-2 flex items-start gap-2">
                <Image
                  src="/images/home/box5-icon3.png"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0 mt-0.5"
                />
                <p className="text-[14px] text-black/60">{campus.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== 主组件 ====================

export function ClassroomHomeView() {
  const { siteName, settings } = useSystemSettings();
  const [home, setHome] = useState<ClassroomHome>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

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

  return (
    <div id="top" className="bg-background">
      <BannerSection banners={banners} siteName={siteName} />
      <HotCoursesSection courses={courses} />
      <NewsSection trainings={trainings} />
      <ScheduleSection trainings={trainings} loading={loading} error={error} />
      <FacultySection teachers={teachers} />
      <WhyChooseSection />
      <ReportsSection />
      <FAQSection />
      <CampusSection phone={settings?.customer_service_phone} />
      <HomeSideDock />
    </div>
  );
}
