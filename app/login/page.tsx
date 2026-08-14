import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { LoginPageView } from "@/features/auth/login-page";

export const metadata: Metadata = {
  title: "登录",
};

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner label="加载登录页" /></div>}>
        <LoginPageView />
      </Suspense>
    </main>
  );
}
