import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // node:sqlite is a Node built-in; keep native-only packages external so Next
  // never tries to bundle them.
  serverExternalPackages: ["bcryptjs"],
  images: {
    // The catalog ships with locally generated SVG/JPEG artwork, so no remote
    // patterns are required by default. Add your CDN here when you upload real photos.
    remotePatterns: [],
    formats: ["image/webp"],
  },
  // Allow local and sandbox preview hosts to hit development endpoints.
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
  async headers() {
    // The nonce-based Content-Security-Policy is applied by proxy.ts.
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Never cache authenticated API responses or shopping state.
        source: "/(api|account|admin|cart|checkout)(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        // Catalog artwork lives in `public/` and is stable for the lifetime of a
        // deploy; Next's default for public files is `max-age=0`, which forced the
        // browser to re-validate every picture on every navigation (60+ conditional
        // requests per click on the home page). Serve them for a week instead.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // The generated brand mark and any other root-level static art.
        source: "/(icon.svg|favicon.ico|apple-icon.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // HSTS is ignored over plain HTTP (local dev), so it is safe to always send.
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
