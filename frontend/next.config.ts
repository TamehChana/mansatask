import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  // Note: Vercel doesn't use standalone, but it's fine to keep for Docker
  output: "standalone",
  
  // Image optimization configuration
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow images from S3 and local storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.*.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
