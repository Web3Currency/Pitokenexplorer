/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript is checked explicitly by `npm run typecheck` and CI.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  devIndicators: {
    buildActivity: false,
  },
}

export default nextConfig
