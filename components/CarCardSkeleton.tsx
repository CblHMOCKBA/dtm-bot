'use client';

export default function CarCardSkeleton() {
  return (
    <div className="tg-card car-card-skeleton">
      {/* Skeleton для изображения */}
      <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <div className="skeleton-shimmer absolute inset-0" />
        
        {/* Skeleton для бейджей */}
        <div className="absolute top-3 right-3 z-10">
          <div className="skeleton-badge w-24 h-7 rounded-lg" />
        </div>
      </div>

      {/* Skeleton для информации */}
      <div className="p-4 space-y-3">
        {/* Название */}
        <div className="skeleton-text h-6 w-3/4 rounded" />
        
        {/* Цена */}
        <div className="skeleton-price h-8 w-1/2 rounded" />
        
        {/* Характеристики */}
        <div className="flex gap-4">
          <div className="skeleton-text h-4 w-16 rounded" />
          <div className="skeleton-text h-4 w-20 rounded" />
        </div>
        
        {/* Кнопка */}
        <div className="skeleton-button h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
