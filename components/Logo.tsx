'use client';

import Image from 'next/image';

interface LogoProps {
  height?: number;
  className?: string;
}

/**
 * Оптимизированный логотип DTM с GPU-ускоренным glow эффектом
 * 
 * Решает проблемы:
 * - Артефакты при скролле (квадрат вокруг логотипа)
 * - Тормоза на слабых устройствах
 * 
 * Как работает:
 * - Glow через radial-gradient (легче чем drop-shadow)
 * - GPU-ускорение через transform: translateZ(0)
 * - will-change подсказывает браузеру оптимизировать
 */
export default function Logo({ height = 104, className = '' }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ 
        height: `${height}px`,
        // GPU ускорение - убирает артефакты при скролле
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      {/* Glow эффект - отдельный слой под логотипом */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 70%)',
          filter: 'blur(20px)',
          transform: 'scale(1.5) translateZ(0)',
          willChange: 'transform'
        }}
      />
      
      {/* Логотип */}
      <Image
        src="/dtm_logo_white.png"
        alt="DTM"
        width={Math.round(height * 2.5)}
        height={height}
        priority
        className="relative z-10"
        style={{ 
          height: `${height}px`,
          width: 'auto', // ИСПРАВЛЕНО: добавлено для сохранения aspect ratio
          // Лёгкий drop-shadow только для чёткости контура
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        }}
      />
    </div>
  );
}
