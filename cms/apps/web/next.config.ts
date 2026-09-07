import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  transpilePackages: ["@ddc/db"],
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
