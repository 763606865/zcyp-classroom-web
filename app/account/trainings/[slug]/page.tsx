import { PageShell } from "@/components/page-shell";
import { MyTrainingDetailView } from "@/features/account/my-training-detail";

export default async function MyTrainingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell>
      <MyTrainingDetailView key={slug} slug={slug} />
    </PageShell>
  );
}
