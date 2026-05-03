/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vierp/shared', '@vierp/database', '@vierp/auth', '@vierp/events'],
}

module.exports = nextConfig
