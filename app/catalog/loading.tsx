'use client';

import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tg-bg racing-stripes">
      {/* Логотип с анимацией */}
      <div className="relative mb-8">
        {/* Пульсирующее свечение */}
        <div className="absolute inset-0 bg-tg-accent/30 blur-3xl animate-pulse"></div>
        
        {/* Вращающееся кольцо вокруг логотипа */}
        <div className="absolute inset-0 -m-4">
          <div className="w-full h-full border-4 border-tg-accent/20 border-t-tg-accent rounded-full animate-spin"></div>
        </div>
        
        {/* Логотип */}
        <div className="relative z-10">
          <Image
            src="/logo.png"
            alt="TOPGEARMOSCOW"
            width={120}
            height={120}
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Название */}
      <h1 
        className="text-2xl font-bold mb-4 animate-pulse" 
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif', 
          fontWeight: 900, 
          letterSpacing: '0.02em' 
        }}
      >
        𝗧𝗢𝗣𝗚𝗘𝗔𝗥𝗠𝗢𝗦𝗖𝗢𝗪
      </h1>

      {/* Текст загрузки */}
      <p className="text-tg-hint text-sm">Загрузка каталога...</p>

      {/* Прогресс-бар */}
      <div className="w-64 h-1 bg-tg-secondary-bg rounded-full overflow-hidden mt-6">
        <div 
          className="h-full bg-gradient-to-r from-tg-accent to-tg-accent-hover animate-loading-bar"
          style={{
            animation: 'loading-bar 1.5s ease-in-out infinite'
          }}
        ></div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
            width: 50%;
          }
          50% {
            width: 80%;
          }
          100% {
            transform: translateX(400%);
            width: 50%;
          }
        }
      `}</style>
    </div>
  );
}
