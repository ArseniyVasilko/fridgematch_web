import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.themealdb.com" }],
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
