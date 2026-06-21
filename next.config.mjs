import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Priorizar red sobre caché para que los nuevos deploys se apliquen inmediatamente
  workboxOptions: {
    // NetworkFirst para chunks de Next.js (JS/CSS) → siempre intenta red primero
    runtimeCaching: [
      {
        urlPattern: /^\/_next\//i,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-assets",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 horas
          },
        },
      },
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "https-calls",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 24 * 60 * 60, // 24 horas
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
}

export default withPWA(nextConfig);
