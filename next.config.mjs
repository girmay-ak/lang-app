/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "node:async_hooks": false,
      async_hooks: false,
    }
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "node:async_hooks": false,
      async_hooks: false,
    }
    return config
  },
}

export default nextConfig
