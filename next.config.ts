import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', // Дозволяє всі піддомени googleusercontent
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
