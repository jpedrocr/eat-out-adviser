import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack é o bundler padrão no Next.js 16
  reactStrictMode: true,
  // Transpile workspace packages
  transpilePackages: ["@eat-out-adviser/api", "@eat-out-adviser/shared"],
};

export default nextConfig;
