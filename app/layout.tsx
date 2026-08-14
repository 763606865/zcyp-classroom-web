import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { siteConfig } from "@/config/site";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:py-10">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
