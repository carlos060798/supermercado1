import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Solo en producción
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
  ],
})

const nextConfig: NextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = withPWA(nextConfig)
