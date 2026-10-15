/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://54.196.14.199/api/v1/:path*',
      },
      {
        source: '/health',
        destination: 'http://54.196.14.199/health',
      },
      {
        source: '/docs-api',
        destination: 'http://54.196.14.199/docs',
      },
      {
        source: '/openapi.json',
        destination: 'http://54.196.14.199/openapi.json',
      },
    ];
  },
};

module.exports = nextConfig;
