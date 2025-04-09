/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    // rewrites is only for development (npm run dev); it won't affect static export
    rewrites: () => [
        {
            source: "/api/:path*",
            destination: "http://localhost:8182/api/:path*",
        },
    ],
};

module.exports = nextConfig
