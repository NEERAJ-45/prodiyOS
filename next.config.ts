import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['fs'],
  outputFileTracingIncludes: {
    '/api/books/**': ['./src/assets/Being-Backend-Prodigy/**/*'],
  },
};

export default nextConfig;

