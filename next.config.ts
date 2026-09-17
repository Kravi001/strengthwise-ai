import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/profile", destination: "/", permanent: false },
      { source: "/meals", destination: "/", permanent: false },
      { source: "/workouts", destination: "/", permanent: false },
      { source: "/progress", destination: "/", permanent: false },
      { source: "/coach", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
