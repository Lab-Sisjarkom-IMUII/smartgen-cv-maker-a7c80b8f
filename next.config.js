/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    // Exclude @imgly/background-removal from server-side bundle
    if (isServer) {
      config.externals = [...(config.externals || []), '@imgly/background-removal']
    }
    
    // Don't parse/minify the WebGPU bundle files
    config.module = {
      ...config.module,
      exprContextCritical: false,
    }
    
    return config
  },
}

module.exports = nextConfig
