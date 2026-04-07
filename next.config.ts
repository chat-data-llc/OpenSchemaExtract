import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedForwardedHosts: ["openschemaextract-backend"],
      allowedOrigins: ["openschemaextract.chat-data.com"],
    },
  },
};

export default nextConfig;
