import { PageShell } from "@/components/page-shell";
import { HomeworkTakeView } from "@/features/account/homework-take-page";

export default async function HomeworkTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <HomeworkTakeView key={id} homeworkId={Number(id)} />
    </PageShell>
  );
}
