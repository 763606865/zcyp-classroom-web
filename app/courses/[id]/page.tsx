import type { Metadata } from "next";
import { CourseDetailView } from "@/features/classroom/course-detail";

export const metadata: Metadata = {
  title: "课程详情",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  return <CourseDetailView courseId={courseId} />;
}
