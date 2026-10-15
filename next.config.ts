import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // The public origin is build configuration, not a Worker runtime secret.
  env: { SITE_URL: process.env.SITE_URL },
};

export default nextConfig;
