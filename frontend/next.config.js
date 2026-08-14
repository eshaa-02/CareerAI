/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal, self-contained server bundle
  // (only the files actually needed at runtime) — this is what the
  // production Dockerfile copies, instead of shipping the full
  // node_modules tree into the image.
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
