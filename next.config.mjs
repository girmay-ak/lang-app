/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking attacks
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Enable XSS protection in older browsers
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Control referrer information
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=*', // Allow geolocation for map
          },
          // Content Security Policy (CSP) - Updated for Mapbox compatibility
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
              "worker-src 'self' blob:", // Allow blob: for Mapbox workers
              "child-src 'self' blob:", // Allow blob: for workers
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              "img-src 'self' data: https: blob:", // Allow all images + blob
              "font-src 'self' data:", 
              "connect-src 'self' https://*.supabase.co https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
  
  webpack(config) {
    config.cache = false

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
