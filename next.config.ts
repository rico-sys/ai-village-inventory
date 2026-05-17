import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScriptエラーをビルド時に無視（開発時は修正推奨）
    ignoreBuildErrors: true,
  },
  turbopack: {
    // プロジェクトルートを明示的に指定
    root: __dirname,
  },
};

export default nextConfig;
