import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import {
  TeacherDetailHeader,
  TeacherDetailContent,
} from "@/features/classroom/teacher-detail";

export const metadata: Metadata = {
  title: "师资详情",
};

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacherId = Number(id);
  return (
    <>
      {/* Header + Nav: outside PageShell → full viewport width */}
      <TeacherDetailHeader teacherId={teacherId} />

      {/* Content: inside PageShell → centered with max-width */}
      <PageShell>
        <TeacherDetailContent teacherId={teacherId} />
      </PageShell>
    </>
  );
}
