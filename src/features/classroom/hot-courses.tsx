'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CoverImage } from '@/components/cover-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { CourseCard } from '@/entities/classroom';
import { getApiErrorMessage } from '@/lib/forms';
import { getHotCourses } from './api';
import { formatPrice, getLikeIconCount, trainingTypeColors, trainingTypeLabels } from './labels';
import { courseTopicMock } from './topic-mock';

/* ─── Like Icon ─── */
function LikeIcon({ className }: { className?: string }) {
	return (
		<img
			src="/images/course/like-icon.png"
			alt="推荐"
			className={className}
			width={16}
			height={16}
		/>
	);
}

/* ─── Banner Section ─── */
function BannerSection() {
	const stats = courseTopicMock.stats;
	return (
		<section className="relative w-full overflow-hidden" style={{ height: 398 }}>
			{/* Background */}
			<img
				src="/images/course/banner-bg.png"
				alt=""
				className="absolute inset-0 h-full w-full object-contain"
				width={1445}
				height={398}
			/>
			{/* Content */}
			<div className="relative mx-auto flex h-full max-w-[1200px] items-center px-6">
				<div className="max-w-[560px]">
					<h1
						className="font-bold"
						style={{ fontSize: 40, lineHeight: '55px', color: '#222' }}
					>
						按岗位找课程
						<br />
						<span style={{ color: '#0F62FE' }}>练成真功夫</span>
					</h1>
					<p
						className="mt-[25px]"
						style={{ fontSize: 20, lineHeight: '30px', color: 'rgba(34,34,34,0.60)' }}
					>
						{courseTopicMock.heroSubtitle}
					</p>
					{/* Stats */}
					<div
						className="mt-[34px] flex gap-10"
						style={{ borderTop: '1px solid rgba(15,98,254,0.20)', paddingTop: 20 }}
					>
						{stats.map(item => (
							<div key={item.label}>
								<p style={{ lineHeight: '51px' }}>
									<span
										style={{ fontSize: 36, color: '#0F62FE', fontWeight: 700 }}
									>
										{item.value}
									</span>
									<span
										className="ml-1"
										style={{ fontSize: 16, color: '#0F62FE' }}
									>
										{item.unit}
									</span>
								</p>
								<p style={{ fontSize: 14, color: '#77787A' }}>{item.label}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─── Editor's Recommendation Section ─── */
function EditorRecommendSection({ courses }: { courses: CourseCard[] }) {
	const [activeIndex, setActiveIndex] = useState(0);

	const displayCourses = useMemo(() => courses.slice(0, 3), [courses]);
	const activeCourse = displayCourses[activeIndex] ?? displayCourses[0];

	if (!activeCourse) return null;

	const likeCount = getLikeIconCount(activeCourse.like_count);

	const goPrev = () =>
		setActiveIndex(i => (i - 1 + displayCourses.length) % displayCourses.length);
	const goNext = () => setActiveIndex(i => (i + 1) % displayCourses.length);

	return (
		<section
			className="relative w-full overflow-hidden"
			style={{ height: 514, backgroundColor: '#F6F8FC' }}
		>
			{/* Background image */}
			<img
				src="/images/course/bg1.png"
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
				width={1439}
				height={514}
			/>
			{/* Content */}
			<div className="relative z-10 mx-auto h-full max-w-[1200px] px-6">
				{/* Title */}
				<h2 className="pt-8 text-xl font-bold" style={{ color: '#222' }}>
					主编推荐
				</h2>
				<div className="mt-6 flex items-center gap-16">
					{/* 左按钮 - 轮播容器外面左侧 */}
					<button
						type="button"
						onClick={goPrev}
						className="relative z-20 flex-shrink-0"
						aria-label="上一张"
					>
						<img src="/images/course/swiper-l.png" alt="" width={24} height={24} />
					</button>
					{/* 轮播容器 - 宽度=一张卡片，overflow-visible显示两侧卡片 */}
					<div
						className="relative overflow-visible"
						style={{ width: 583, height: 328, flexShrink: 0 }}
					>
						{displayCourses.map((course, idx) => {
							const n = displayCourses.length;
							let circularOffset = ((idx - activeIndex) % n + n) % n;
							if (circularOffset > n / 2) circularOffset -= n;
							const absOffset = Math.abs(circularOffset);
							const isActive = circularOffset === 0;
							return (
								<div
									key={course.id}
									className="absolute top-0 overflow-hidden rounded-lg transition-all duration-300"
									style={{
										width: 583,
										height: 328,
										left: circularOffset * 80,
										opacity: isActive ? 1 : Math.max(0.3, 1 - absOffset * 0.35),
										transform: `scale(${isActive ? 1 : 0.88})`,
										zIndex: isActive ? 10 : 5 - absOffset,
										cursor: 'pointer',
									}}
									onClick={() => setActiveIndex(idx)}
								>
									<CoverImage
										src={course.cover}
										alt={course.title}
										className="h-full w-full"
									/>
									<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-10">
										<p className="text-lg font-medium text-white">
											{course.title}
										</p>
									</div>
								</div>
							);
						})}
					</div>
					{/* 右按钮 - 轮播容器外面右侧 */}
					<button
						type="button"
						onClick={goNext}
						className="relative z-20 flex-shrink-0"
						aria-label="下一张"
					>
						<img src="/images/course/swiper-r.png" alt="" width={24} height={24} />
					</button>

					{/* Right: Detail Card (stacked effect) */}
					<div className="relative" style={{ width: 432, height: 328, flexShrink: 0 }}>
						{/* Stacked background cards */}
						<div
							className="absolute rounded-lg bg-white shadow-sm"
							style={{ width: 400, height: 300, top: 16, left: -24, zIndex: 1 }}
						/>
						<div
							className="absolute rounded-lg bg-white shadow-sm"
							style={{ width: 410, height: 310, top: 10, left: -14, zIndex: 2 }}
						/>
						{/* Front card */}
						<div
							className="absolute rounded-lg bg-white p-6 shadow-lg"
							style={{ width: 432, height: 328, top: 0, left: 0, zIndex: 3 }}
						>
							{/* Like icons - top right */}
							<div className="absolute right-5 top-5 flex gap-1">
								{Array.from({ length: likeCount }).map((_, i) => (
									<LikeIcon key={i} className="h-4 w-4" />
								))}
							</div>
							{/* Title */}
							<h3
								className="line-clamp-2 pr-16 font-bold"
								style={{ fontSize: 24, lineHeight: '32px', color: '#222' }}
							>
								{activeCourse.title}
							</h3>
							{/* Teacher info */}
							<p
								className="mt-[13px]"
								style={{ fontSize: 14, color: 'rgba(0,0,0,0.9)' }}
							>
								{activeCourse.teacher?.name ?? '中测讲师'}
								{activeCourse.lesson_count
									? ` · ${activeCourse.lesson_count}课时`
									: ''}
								{activeCourse.type
									? ` · ${trainingTypeLabels[activeCourse.type] ?? activeCourse.type}`
									: ''}
							</p>
							{/* Summary */}
							<p
								className="mt-[10px] line-clamp-2"
								style={{ fontSize: 16, color: '#555', lineHeight: '26px' }}
							>
								{activeCourse.summary || courseTopicMock.featuredSummary}
							</p>
							{/* Tags */}
							<div className="mt-[9px] flex flex-wrap gap-2">
								{courseTopicMock.featuredTags.map(tag => (
									<span
										key={tag}
										className="rounded"
										style={{
											padding: '3px 10px',
											backgroundColor: '#EAF1FC',
											color: '#0F62FE',
											fontSize: 14,
										}}
									>
										{tag}
									</span>
								))}
							</div>
							{/* Divider */}
							<div
								className="mt-[16px]"
								style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
							/>
							{/* Bottom: button + price */}
							<div className="mt-[14px] flex items-center justify-between">
								<Link
									href={`/courses/${activeCourse.slug}`}
									className="inline-flex items-center gap-1.5 rounded"
									style={{
										padding: '6px 14px',
										backgroundColor: '#0F62FE',
										color: '#fff',
										fontSize: 14,
									}}
								>
									<img
										src="/images/course/contact-icon.png"
										alt=""
										width={16}
										height={16}
									/>
									查看课程
								</Link>
								<span style={{ fontSize: 16, color: '#0F62FE', fontWeight: 600 }}>
									{formatPrice(activeCourse.is_free, activeCourse.price)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─── Course List Section ─── */
function CourseListSection() {
	const [keyword, setKeyword] = useState('');
	const [type, setType] = useState('all');
	const [featured, setFeatured] = useState('all');
	const [direction, setDirection] = useState('all');
	const [sortBy, setSortBy] = useState('default');
	const [page, setPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [items, setItems] = useState<CourseCard[]>([]);
	const [total, setTotal] = useState(0);
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		const timer = window.setTimeout(() => {
			setLoading(true);
			void getHotCourses({
				q: keyword.trim() || undefined,
				type: type === 'all' ? undefined : type,
				featured: featured === 'featured' ? true : undefined,
				page,
			})
				.then(result => {
					if (cancelled) return;
					setItems(result.data.data);
					setTotal(result.data.total);
					setLastPage(result.data.last_page ?? 1);
					setError(undefined);
				})
				.catch((err: unknown) => {
					if (!cancelled) setError(getApiErrorMessage(err, '课程列表加载失败'));
				})
				.finally(() => {
					if (!cancelled) setLoading(false);
				});
		}, 250);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [keyword, type, featured, page]);

	return (
		<section className="w-full bg-white py-6 md:py-10">
			<div className="mx-auto max-w-[1200px] px-4 md:px-6">
				{/* Search */}
				<div className="flex items-center overflow-hidden rounded-md border border-border">
					<button
						type="button"
						className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[#0F62FE]"
						aria-label="搜索"
					>
						<img src="/images/course/search-icon.png" alt="" width={18} height={18} />
					</button>
					<input
						value={keyword}
						onChange={event => {
							setKeyword(event.target.value);
							setPage(1);
						}}
						placeholder="搜索课程"
						aria-label="搜索课程"
						className="h-10 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
					/>
				</div>

				{/* Tags */}
				<div className="mt-[22px] flex flex-wrap gap-4">
					<button
						type="button"
						onClick={() => setDirection('all')}
						className="rounded transition-colors"
						style={{
							padding: '7px 16px',
							fontSize: 14,
							border: `1px solid ${direction === 'all' ? '#0F62FE' : '#ECECEC'}`,
							color: direction === 'all' ? '#0F62FE' : '#999',
							backgroundColor:
								direction === 'all' ? 'rgba(15,98,254,0.1)' : 'transparent',
							borderRadius: 6,
						}}
					>
						全部
					</button>
					{courseTopicMock.directions.map(item => (
						<button
							key={item.id}
							type="button"
							onClick={() => setDirection(item.id)}
							className="rounded transition-colors"
							style={{
								padding: '7px 16px',
								fontSize: 14,
								border: `1px solid ${direction === item.id ? '#0F62FE' : '#ECECEC'}`,
								color: direction === item.id ? '#0F62FE' : '#999',
								backgroundColor:
									direction === item.id ? 'rgba(15,98,254,0.1)' : 'transparent',
								borderRadius: 6,
							}}
						>
							{item.label}
						</button>
					))}
				</div>

				{/* Filters */}
				<div className="mt-[22px] flex gap-3">
					<Select
						value={type}
						onValueChange={value => {
							setType(value);
							setPage(1);
						}}
					>
						<SelectTrigger
							className="w-32 rounded-full border-0 bg-[#F5F5F5] px-4"
							aria-label="课程类型"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部类型</SelectItem>
							<SelectItem value="online">线上</SelectItem>
							<SelectItem value="offline">线下</SelectItem>
							<SelectItem value="live">直播</SelectItem>
							<SelectItem value="mixed">混合</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={featured}
						onValueChange={value => {
							setFeatured(value);
							setPage(1);
						}}
					>
						<SelectTrigger
							className="w-32 rounded-full border-0 bg-[#F5F5F5] px-4"
							aria-label="推荐筛选"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部课程</SelectItem>
							<SelectItem value="featured">仅推荐</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Divider */}
				<div
					className="mt-[41px]"
					style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
				/>

				{/* Title + Sort */}
				<div className="mt-[50px] flex items-center justify-between">
					<h2 className="text-xl font-bold" style={{ color: '#222' }}>
						全部课程
					</h2>
					<Select value={sortBy} onValueChange={setSortBy}>
						<SelectTrigger
							className="w-28 rounded-full border-0 bg-[#F5F5F5] px-4"
							aria-label="排序"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="default">综合排序</SelectItem>
							<SelectItem value="price_asc">价格从低到高</SelectItem>
							<SelectItem value="price_desc">价格从高到低</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Course Grid */}
				<div className="mt-6 md:mt-[32px]">
					{loading ? (
						<div className="flex justify-center py-16">
							<Spinner label="加载热门课程" />
						</div>
					) : null}
					{!loading && error ? (
						<EmptyState title="无法加载课程" description={error} />
					) : null}
					{!loading && !error && items.length === 0 ? (
						<EmptyState
							title="没有匹配的课程"
							description="试试更换关键词或筛选条件。"
						/>
					) : null}
					{!loading && !error && items.length > 0 ? (
						<div
							className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
							style={{ columnGap: 18, rowGap: 16 }}
						>
							{items.map(course => (
								<CourseListItem key={course.id} course={course} />
							))}
						</div>
					) : null}
					{/* Pagination - always visible */}
					<div className="mt-8">
						<Pagination
							page={page}
							lastPage={lastPage}
							loading={loading}
							onPageChange={setPage}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─── Course List Item ── */
function CourseListItem({ course }: { course: CourseCard }) {
	const likeCount = getLikeIconCount(course.like_count);
	const typeColor = trainingTypeColors[course.type] ?? '#555';
	const typeLabel = trainingTypeLabels[course.type] ?? course.type;

	return (
		<Link
			href={`/courses/${course.slug}`}
			className="block overflow-hidden rounded-lg border border-[#ECECEC] bg-white"
		>
			{/* Image */}
			<div className="relative w-full" style={{ paddingBottom: '56.29%' /* 161/286 */ }}>
				<CoverImage
					src={course.cover}
					alt={course.title}
					className="absolute inset-0 h-full w-full"
				/>
			</div>
			{/* Content */}
			<div style={{ padding: '12px 17px 13px' }}>
				{/* Title */}
				<h3
					className="line-clamp-2 font-medium"
					style={{ fontSize: 16, lineHeight: '24px', color: '#222' }}
				>
					{course.title}
				</h3>
				{/* Teacher + lessons */}
				<p className="mt-[10px]" style={{ fontSize: 14, color: '#555' }}>
					{course.teacher?.name ?? '中测讲师'}
					{course.lesson_count ? ` · ${course.lesson_count}课时` : ''}
				</p>
				{/* Like + type */}
				<div className="mt-[13px] flex items-center justify-between">
					<div className="flex items-center gap-1">
						<span style={{ fontSize: 14, color: '#555' }}>推荐值：</span>
						{Array.from({ length: likeCount }).map((_, i) => (
							<LikeIcon key={i} className="h-4 w-4" />
						))}
					</div>
					<span style={{ fontSize: 14, color: typeColor }}>授课方式：{typeLabel}</span>
				</div>
				{/* Divider */}
				<div
					className="mt-[14px]"
					style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
				/>
				{/* Button + Price */}
				<div className="mt-[11px] flex items-center justify-between">
					<span
						className="inline-flex items-center rounded"
						style={{
							padding: '2px 7px',
							fontSize: 14,
							color: '#0F62FE',
							border: '1px solid #0F62FE',
							backgroundColor: 'transparent',
						}}
					>
						咨询课程
					</span>
					<span style={{ fontSize: 16, color: '#0F62FE', fontWeight: 600 }}>
						{formatPrice(course.is_free, course.price)}
					</span>
				</div>
			</div>
		</Link>
	);
}

/* ─── How to Choose Section ─── */
function HowToChooseSection() {
	const steps = courseTopicMock.chooseSteps;
	const icons = [
		'/images/course/box-icon1.png',
		'/images/course/box-icon2.png',
		'/images/course/box-icon3.png',
	];

	return (
		<section className="relative w-full overflow-hidden" style={{ height: 314 }}>
			{/* Background */}
			<img
				src="/images/course/bg.png"
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
				width={1440}
				height={314}
			/>
			{/* Content */}
			<div className="relative z-10 mx-auto max-w-[1200px] px-6">
				{/* Title */}
				<h2 className="pt-8" style={{ fontSize: 24, color: '#222', fontWeight: 700 }}>
					如何选课
				</h2>
				{/* Description */}
				<p className="mt-[15px]" style={{ fontSize: 14, color: 'rgba(0,0,0,0.60)' }}>
					三步快速匹配适合你的课程
				</p>
				{/* Steps */}
				<div className="mt-[32px] flex gap-6">
					{steps.map((step, idx) => (
						<div
							key={step.title}
							className="flex items-start gap-3"
							style={{
								backgroundColor: '#fff',
								padding: '16px 14px 18px',
								borderRadius: 4,
								flex: 1,
								maxWidth: '280px',
							}}
						>
							<img
								src={icons[idx]}
								alt=""
								width={48}
								height={48}
								className="flex-shrink-0"
							/>
							<div>
								<p className="font-bold" style={{ fontSize: 16, color: '#222' }}>
									0{idx + 1} {step.title}
								</p>
								<p className="mt-1" style={{ fontSize: 14, color: '#666' }}>
									{step.desc}
								</p>
							</div>
						</div>
					))}
				</div>
				{/* Service icon - right side, bottom aligned */}
				<img
					src="/images/course/service-icon.png"
					alt=""
					className="absolute bottom-0"
					style={{ right: 0, zIndex: 5, bottom: -95 }}
					width={294}
					height={170}
				/>
			</div>
		</section>
	);
}

/* ─── Main View ─── */
export function HotCoursesView() {
	const [items, setItems] = useState<CourseCard[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		void getHotCourses({ per_page: 12, page: 1 })
			.then(result => {
				if (cancelled) return;
				setItems(result.data.data);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div>
			<BannerSection />
			<EditorRecommendSection courses={loading ? [] : items} />
			<CourseListSection />
			<HowToChooseSection />
		</div>
	);
}
