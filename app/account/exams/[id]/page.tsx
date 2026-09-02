import { PageShell } from "@/components/page-shell";
import { ExamTakeView } from "@/features/account/exam-take-page";

export default async function ExamTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <ExamTakeView key={id} examId={Number(id)} />
    </PageShell>
  );
}
