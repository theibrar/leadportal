import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turn off Next.js dev indicators
  devIndicators: false,

  // Enable automatic Gzip and Brotli compression for JS, CSS, HTML & API payloads
  compress: true,

  // Hide powered-by header to save payload size & enhance security
  poweredByHeader: false,

  // Production React optimizations
  reactStrictMode: true,

  // High-performance HTTP headers for static caching
  async headers() {
    return [
      {
        source: "/:all*(svg|png|jpg|jpeg|webp|woff2|woff|ttf|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
