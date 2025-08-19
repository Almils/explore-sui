// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Don’t fail the production build on ESLint errors.
    ignoreDuringBuilds: true,
  },
  // If you ever use images from external hosts, add them here:
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
