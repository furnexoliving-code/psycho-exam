/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The papers used to live under /watch-table (the first test's name); old
  // links and bookmarks still arrive there.
  async redirects() {
    return [
      { source: "/watch-table/:path*", destination: "/test/:path*", permanent: true },
      { source: "/admin/watch-table/:path*", destination: "/admin/papers/:path*", permanent: true },
      { source: "/admin/watch-table", destination: "/admin/papers", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // A candidate's photo (up to 2 MB) travels through a server action.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
