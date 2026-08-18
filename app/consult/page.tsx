import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { Spinner } from "@/components/ui/spinner";
import { ConsultPageView } from "@/features/leads/consult-page";

export const metadata: Metadata = {
  title: "课程咨询",
};

export default function ConsultPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner label="加载咨询页" /></div>}>
        <ConsultPageView />
      </Suspense>
    </PageShell>
  );
}
