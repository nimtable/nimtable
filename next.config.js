/** @type {import('next').NextConfig} */
const nextConfig = {
  // rewrites is only for development (pnpm run dev); it won't affect static export
  rewrites: () => [
    {
      source: "/api/:path*",
      destination: "http://localhost:8182/api/:path*",
    },
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ]
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  distDir: process.env.NODE_ENV === "development" ? ".next/dev" : ".next/build",
}

module.exports = nextConfig
