import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  eslint: {
    // ESLint errors won't fail the production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TS errors in the legacy dashboard templates won't fail the build
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        // Supabase Storage (cloud projects)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    domains: ["ui.shadcn.com"],
  },
};

export default withNextIntl(nextConfig);
