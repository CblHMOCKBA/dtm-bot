/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // На localhost отключаем оптимизацию (избегаем таймаутов)
    // На Vercel (production) оптимизация работает автоматически
    unoptimized: process.env.NODE_ENV === 'development',
    // Кэширование на 30 дней (работает на Vercel)
    minimumCacheTTL: 2592000,
    // Форматы для автоконвертации
    formats: ['image/webp', 'image/avif'],
    // Размеры для генерации
    deviceSizes: [320, 420, 640, 768, 1024],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}

module.exports = nextConfig
