import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/brief",
        destination: "/today",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.API_URL || "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
