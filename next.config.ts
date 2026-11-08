import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pg"],
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
