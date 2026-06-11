/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pet/shared', '@pet/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'trae-api-cn.mchost.guru' },
      { protocol: 'https', hostname: '**.aliyuncs.com' },
      { protocol: 'https', hostname: '**.qiniucdn.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'dayjs'],
  },
};

module.exports = nextConfig;
