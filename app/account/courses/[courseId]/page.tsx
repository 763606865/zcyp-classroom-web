import { PageShell } from "@/components/page-shell";
import { CourseLearnView } from "@/features/learn/course-learn-page";

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <PageShell>
      <CourseLearnView key={courseId} courseId={Number(courseId)} />
    </PageShell>
  );
}
