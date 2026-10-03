import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/login", destination: "/profile", permanent: false },
      { source: "/about", destination: "/profile", permanent: false },
    ];
  },
};

export default nextConfig;
