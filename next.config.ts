import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static export for Cloudflare Pages

  images: {
    unoptimized: true, // Cloudflare has its own image optimization
  },
};

export default nextConfig;
