import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetailView } from "@/features/classroom/course-detail";
import { getCourseDetailBySlug } from "@/features/classroom/course-detail-mock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseDetailBySlug(slug);
  return {
    title: course?.title ?? "课程详情",
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseDetailBySlug(slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailView course={course} />;
}
