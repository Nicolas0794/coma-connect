import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Permitir adjuntos de campaña (hasta 8 archivos de ~25MB).
      bodySizeLimit: "220mb",
    },
  },
  async rewrites() {
    return [
      // URL LinkedIn-style: /@maria-perez → /c/maria-perez
      { source: "/@:slug", destination: "/c/:slug" },
    ];
  },
};

export default nextConfig;
