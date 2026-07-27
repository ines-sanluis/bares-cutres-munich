import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Supabase Storage public URLs live at <project-ref>.supabase.co
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Photos are downscaled in the browser before upload, but leave headroom
      // above the 1MB default so a large image never fails outright.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
