import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // 本地开发通过 Nginx 使用自定义域名访问。Next.js 16 默认拒绝来自
  // 非启动主机名的开发资源和 HMR WebSocket 请求。
  allowedDevOrigins: ["local.caiyun-next.com"],
  async rewrites() {
    if (!apiUrl) return [];

    return [
      {
        source: "/backend-api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
