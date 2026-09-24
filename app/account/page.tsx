import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { Spinner } from "@/components/ui/spinner";
import { AccountPageView } from "@/features/account/account-page";

export const metadata: Metadata = {
  title: "个人中心",
};

export default function AccountPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner label="加载个人中心" /></div>}>
        <AccountPageView />
      </Suspense>
    </PageShell>
  );
}
