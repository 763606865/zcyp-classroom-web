import { PageShell } from "@/components/page-shell";
import { TrainingDetailView } from "@/features/classroom/training-detail";

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell>
      <TrainingDetailView key={slug} slug={slug} />
    </PageShell>
  );
}
