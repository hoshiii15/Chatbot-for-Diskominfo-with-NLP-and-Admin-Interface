/** @type {import('next').NextConfig} */
const path = require('path')
const nextConfig = {
  // produce a standalone server build so the Dockerfile can copy the standalone output
  output: 'standalone',
  // IMPORTANT: In production (Docker) builds the NEXT_PUBLIC_API_URL must be set at
  // build time so Next.js rewrites/embed the correct backend host. When building
  // inside Docker on Windows/macOS set it to http://host.docker.internal:3001 or
  // pass a specific domain for deployed environments.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    // Ensure the '@' path alias resolves to ./src for webpack during build
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
