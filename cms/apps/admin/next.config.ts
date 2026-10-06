import type { NextConfig } from "next";

const extras = ["@electric-sql/pglite", "postgres", "firebase-admin"];

const nextConfig: NextConfig = {
  trailingSlash: true,
  transpilePackages: ["@ddc/db"],
  // Keep native/heavy packages out of the webpack bundle.
  serverExternalPackages: extras,
  webpack: (config, { isServer }) => {
    if (isServer) {
      const prev = config.externals;
      if (Array.isArray(prev)) {
        config.externals = [...prev, ...extras];
      } else if (typeof prev === "function") {
        config.externals = [
          prev,
          ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
            if (request && extras.some((p) => request === p || request.startsWith(`${p}/`))) {
              return callback(null, `commonjs ${request}`);
            }
            callback();
          },
        ];
      } else if (prev) {
        config.externals = [prev, ...extras];
      } else {
        config.externals = extras;
      }
    }
    return config;
  },
};

export default nextConfig;
