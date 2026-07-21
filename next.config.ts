import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: ["res.cloudinary.com", "ik.imagekit.io"],
    remotePatterns: [
      { protocol: "https", hostname: "**.sirv.com" },
    ],
  },
};

export default nextConfig;
