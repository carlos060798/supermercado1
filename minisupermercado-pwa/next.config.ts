/* eslint-disable @typescript-eslint/no-require-imports */
import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // Cache all HTTP(S) requests
      handler: "CacheFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    {
      urlPattern: /\/api\/.*/, // Cache API requests
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},
  },
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react/jsx-runtime.js": "react/jsx-runtime",
        "react/jsx-dev-runtime.js": "react/jsx-dev-runtime",
      };
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || "Minisupermercado PWA",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
