import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ddc/db"],
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
