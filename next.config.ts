import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This will disable ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  /* other config options here */
};

export default nextConfig;
