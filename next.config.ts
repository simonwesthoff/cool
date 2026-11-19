import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Google profile pictures of signed-in users.
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  // The macrocycle planning's steps were separate pages; they are one page
  // now, opened at the step.
  async redirects() {
    return ["base-data", "swot", "intensity", "exercises"].map((step) => ({
      source: `/athletes/:id/macrocycle/${step}`,
      destination: `/athletes/:id/macrocycle/planning?step=${step}`,
      permanent: true,
    }));
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
