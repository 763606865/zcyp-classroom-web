import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { TeacherDetailView } from "@/features/classroom/teacher-detail";

export const metadata: Metadata = {
  title: "师资详情",
};

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <TeacherDetailView key={id} teacherId={Number(id)} />
    </PageShell>
  );
}
