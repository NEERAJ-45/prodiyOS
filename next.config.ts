import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['fs'],
  outputFileTracingIncludes: {
    '/api/books/**': ['./src/assets/Being-Backend-Prodigy/**/*'],
  },
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;


