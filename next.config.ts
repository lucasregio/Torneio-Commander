import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // API + SQLite precisa de handlers dinâmicos (cookies/DB)
  cacheComponents: false,
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
