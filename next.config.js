/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: () => [
        {
            source: "/api/:path*",
            destination: "http://localhost:8182/api/:path*",
        },
    ],
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig
