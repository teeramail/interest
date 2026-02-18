// export const dynamic = "force-dynamic";

//** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sgp1.digitaloceanspaces.com",
      },
    ],
  },
  // Disable static generation for error pages to avoid prerender issues
  experimental: {
    // Use dynamic rendering for error pages
    missingSuspenseWithCSRBailout: false,
  },
};
