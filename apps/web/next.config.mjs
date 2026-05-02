/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@postoinsight/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@postoinsight/db', 'postgres', 'bcryptjs'],
  },
}

export default nextConfig
