import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  turbopack: {
    // プロジェクトルートを明示的に指定（警告を消すため）
    root: __dirname,
  },
};

export default nextConfig;
