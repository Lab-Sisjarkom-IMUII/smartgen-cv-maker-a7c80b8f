/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Simplified config for deployment compatibility
  experimental: {
    esmExternals: false,
  },
  swcMinify: true,
}

module.exports = nextConfig
