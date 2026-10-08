import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: path.join(__dirname, "../../.env") });

const extras = ["@electric-sql/pglite", "postgres", "firebase-admin"];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
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
