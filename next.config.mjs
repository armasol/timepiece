/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'robinhoodchain.blockscout.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: '**.ipfs.w3s.link' }
    ]
  }
};
export default nextConfig;
