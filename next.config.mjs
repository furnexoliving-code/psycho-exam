/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // A candidate's photo (up to 2 MB) travels through a server action.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
