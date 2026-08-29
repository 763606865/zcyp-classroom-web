import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const imApiUrl = process.env.NEXT_PUBLIC_IM_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // 本地开发通过 Nginx 使用自定义域名访问。Next.js 16 默认拒绝来自
  // 非启动主机名的开发资源和 HMR WebSocket 请求。
  allowedDevOrigins: ["local.zcyp-classroom-web.com", "zcyp-classroom-web.jxhrm.com"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    const rewrites: { source: string; destination: string }[] = [];
    if (apiUrl) {
      rewrites.push({
        source: "/backend-api/:path*",
        destination: `${apiUrl}/api/:path*`,
      });
    }
    if (imApiUrl) {
      rewrites.push({
        source: "/im-api/:path*",
        destination: `${imApiUrl}/:path*`,
      });
    }
    return rewrites;
  },
};

export default nextConfig;
