import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['fs'],
  outputFileTracingIncludes: {
    '/api/books/**': ['./src/assets/Being-Backend-Prodigy/**/*'],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;


