import type { Metadata } from "next";
import { AccountPageView } from "@/features/account/account-page";

export const metadata: Metadata = {
  title: "个人中心",
};

export default function AccountPage() {
  return (
    <main>
      <AccountPageView />
    </main>
  );
}
