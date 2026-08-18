import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AccountPageView } from "@/features/account/account-page";

export const metadata: Metadata = {
  title: "个人中心",
};

export default function AccountPage() {
  return (
    <PageShell>
      <AccountPageView />
    </PageShell>
  );
}
