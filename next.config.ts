import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR"],
  },
};

export default nextConfig;
