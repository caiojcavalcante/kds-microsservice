import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-production.yooga.com.br",
      },
    ],
  },

};

export default nextConfig;
