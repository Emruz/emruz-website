import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Motiv's "Get Premium" button opens /motiv/pricing
      { source: "/motiv/pricing", destination: "/motiv#plans", permanent: false },
    ];
  },
};

export default nextConfig;
