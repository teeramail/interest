/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: 'standalone',
  distDir: '.next',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sgp1.digitaloceanspaces.com",
      },
    ],
  },
};

export default config;
