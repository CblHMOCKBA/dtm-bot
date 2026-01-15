'use client';

import { Car } from '@/types';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/lib/useFavorites';
import { getTelegramWebApp } from '@/lib/telegram';
import { useState, useRef, useEffect } from 'react';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
}

// Создаём URL для thumbnail (Supabase image transformation)
const getThumbnailUrl = (url: string): string => {
  // Supabase Storage transformation: /object/public/ -> /render/image/public/ + params
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + '?width=50&quality=20';
  }
  return url;
};

// Компонент для фото с blur-up эффектом
function BlurUpImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const thumbnailUrl = getThumbnailUrl(src);
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Placeholder - размытый thumbnail или градиент */}
      {showPlaceholder && (
        <div className="absolute inset-0 z-0">
          {/* Пробуем загрузить thumbnail */}
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover blur-xl scale-110"
            onError={(e) => {
              // Если thumbnail не загрузился - показываем градиент
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback градиент */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black animate-pulse"
            style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            }}
          />
          {/* Shimmer эффект */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              animation: 'shimmer-slide 1.5s infinite',
            }}
          />
        </div>
      )}
      
      {/* Основное фото */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => {
          setIsLoaded(true);
          // Убираем placeholder с небольшой задержкой для плавности
          setTimeout(() => setShowPlaceholder(false), 300);
        }}
      />
    </div>
  );
}

export default function CarCard({ car, onClick }: CarCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const isSold = car.status === 'sold';
  const isNew = !isSold && 
                !car.hide_new_badge && 
                car.created_at && 
                (new Date().getTime() - new Date(car.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const isFav = isFavorite(car.id, 'car');
  const hasMultiplePhotos = car.photos && car.photos.length > 1;
  const photoCount = car.photos?.length || 0;

  // Intersection Observer - грузим только видимые карточки
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    toggleFavorite(car.id, 'car');
    
    const tg = getTelegramWebApp();
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  // При начале взаимодействия - разрешаем загрузку остальных фото
  const handleInteractionStart = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Mouse drag для десктопа
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current || !hasMultiplePhotos) return;
    handleInteractionStart();
    isDragging.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scrollRef.current || startX.current === 0) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      isDragging.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    if (!scrollRef.current) return;
    startX.current = 0;
    scrollRef.current.style.cursor = 'grab';
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleMouseLeave = () => {
    if (startX.current !== 0) handleMouseUp();
  };

  // Touch handlers
  const handleTouchStart = () => {
    handleInteractionStart();
    isDragging.current = false;
  };

  const handleTouchEnd = () => {
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="tg-card overflow-hidden cursor-pointer transition-all active:scale-[0.98] relative group"
    >
      {/* Галерея со свайпом */}
      <div className="aspect-[4/3] bg-black/30 relative overflow-hidden">
        {isVisible && car.photos && car.photos.length > 0 ? (
          <>
            <div 
              ref={scrollRef}
              className="photo-gallery w-full h-full"
              style={{ scrollBehavior: 'auto' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {car.photos.map((photo, index) => (
                <div 
                  key={index} 
                  className="photo-gallery-item h-full"
                >
                  {/* Первое фото грузится сразу с blur-up, остальные - при взаимодействии */}
                  {index === 0 || hasInteracted ? (
                    <BlurUpImage
                      src={photo}
                      alt={`${car.brand} ${car.model} - фото ${index + 1}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                      <div 
                        className="w-full h-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                          animation: 'shimmer-slide 1.5s infinite',
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Индикатор количества фото */}
            {photoCount > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium z-10">
                {photoCount} фото
              </div>
            )}
          </>
        ) : !isVisible ? (
          // Placeholder пока карточка не в viewport
          <div className="w-full h-full bg-gradient-to-br from-tg-secondary-bg to-tg-bg" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tg-secondary-bg to-tg-bg">
            <svg className="w-20 h-20 text-tg-hint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        {/* Для ПРОДАННЫХ авто - плашка "Продано" */}
        {isSold && (
          <>
            <div className="absolute inset-0 bg-black/20 z-[3] pointer-events-none"></div>
            <div 
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-20 pointer-events-none"
              style={{ backgroundColor: '#6b7280', opacity: 0.95 }}
            >
              <span className="text-white text-xs font-bold uppercase tracking-wide">Продано</span>
            </div>
          </>
        )}

        {/* Для новых авто - элегантная светящаяся линия сверху */}
        {!isSold && isNew && (
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] z-20 pointer-events-none"
            style={{ 
              background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.8), rgba(255, 255, 255, 0.9), rgba(255, 215, 0, 0.8), transparent)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />
        )}

        {/* Кнопка избранного */}
        {!isSold && (
          <button
            onClick={handleFavoriteClick}
            className={`
              absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center 
              transition-all duration-200 backdrop-blur-sm z-20
              ${isFav 
                ? 'bg-red-500 text-white' 
                : 'bg-black/40 text-white/80 hover:bg-black/60'
              }
              active:scale-90
              ${isAnimating ? 'heart-pop' : ''}
            `}
            aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Контент */}
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-base text-white line-clamp-1">
          {car.brand} {car.model}
        </h3>

        <div className="price-display text-xl text-gradient">
          {formatPrice(car.price)} ₽
        </div>

        <div className="flex items-center gap-2 text-xs text-tg-hint flex-wrap">
          <span>{car.year}</span>
          <span className="text-tg-accent">•</span>
          <span>{car.mileage.toLocaleString()} км</span>
          {car.specs?.engine && (
            <>
              <span className="text-tg-accent">•</span>
              <span>{car.specs.engine}{!car.specs.engine.toLowerCase().includes('л') ? ' л' : ''}</span>
            </>
          )}
          {car.specs?.power && (
            <>
              <span className="text-tg-accent">•</span>
              <span>{car.specs.power}{!car.specs.power.toLowerCase().includes('л.с') && !car.specs.power.toLowerCase().includes('hp') ? ' л.с.' : ''}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
