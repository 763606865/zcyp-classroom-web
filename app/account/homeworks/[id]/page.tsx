import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AccountShell } from "@/features/account/account-shell";
import { HomeworkTakeView } from "@/features/account/homework-take-page";

export const metadata: Metadata = {
  title: "作业详情",
};

export default async function HomeworkTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <AccountShell active="homeworks">
        <HomeworkTakeView key={id} homeworkId={Number(id)} />
      </AccountShell>
    </PageShell>
  );
}
