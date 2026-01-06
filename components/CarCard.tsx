'use client';

import { Car } from '@/types';
import { Sparkles, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFavorites } from '@/lib/useFavorites';
import { getTelegramWebApp } from '@/lib/telegram';
import { useState, useCallback, useRef } from 'react';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
}

export default function CarCard({ car, onClick }: CarCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isAnimatingRef = useRef(false);
  
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

  // Плавное переключение фото (crossfade)
  const changePhoto = useCallback((newIndex: number) => {
    if (isAnimatingRef.current || !car.photos || car.photos.length === 0 || newIndex === displayIndex) return;
    
    isAnimatingRef.current = true;
    
    // Устанавливаем следующее фото и начинаем анимацию появления
    setNextIndex(newIndex);
    
    // Небольшая задержка для загрузки изображения
    requestAnimationFrame(() => {
      setShowNext(true);
    });
    
    // После завершения анимации - переключаем основной индекс
    setTimeout(() => {
      setDisplayIndex(newIndex);
      setShowNext(false);
      setNextIndex(null);
      isAnimatingRef.current = false;
    }, 350);
  }, [car.photos, displayIndex]);

  const nextPhoto = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!hasMultiplePhotos) return;
    const newIndex = (displayIndex + 1) % car.photos.length;
    changePhoto(newIndex);
  }, [hasMultiplePhotos, displayIndex, car.photos?.length, changePhoto]);

  const prevPhoto = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!hasMultiplePhotos) return;
    const newIndex = (displayIndex - 1 + car.photos.length) % car.photos.length;
    changePhoto(newIndex);
  }, [hasMultiplePhotos, displayIndex, car.photos?.length, changePhoto]);

  // Обработка свайпов
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && hasMultiplePhotos) {
      nextPhoto(e);
    }
    if (isRightSwipe && hasMultiplePhotos) {
      prevPhoto(e);
    }
  };

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

  const handleIndicatorClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    changePhoto(index);
  };

  return (
    <div
      onClick={onClick}
      className="tg-card overflow-hidden cursor-pointer transition-all active:scale-[0.98] relative group"
    >
      {/* Изображение с crossfade анимацией */}
      <div 
        className="aspect-[4/3] bg-tg-secondary-bg relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {car.photos && car.photos.length > 0 ? (
          <>
            {/* Основное фото (текущее) */}
            <img
              src={car.photos[displayIndex]}
              alt={`${car.brand} ${car.model}`}
              className="w-full h-full object-cover absolute inset-0 z-[1]"
              draggable={false}
            />
            
            {/* Следующее фото (появляется поверх с анимацией) */}
            {nextIndex !== null && (
              <img
                src={car.photos[nextIndex]}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-full object-cover absolute inset-0 z-[2]"
                draggable={false}
                style={{
                  opacity: showNext ? 1 : 0,
                  transition: 'opacity 300ms ease-in-out',
                }}
              />
            )}

            {/* Навигационные кнопки */}
            {hasMultiplePhotos && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 active:scale-90 z-10"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 active:scale-90 z-10"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                {/* Индикаторы фото */}
                <div className="absolute bottom-2 left-0 right-0 flex gap-1 justify-center z-10">
                  {car.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleIndicatorClick(e, index)}
                      className={`
                        h-1 rounded-full transition-all duration-300
                        ${index === displayIndex 
                          ? 'w-4 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]' 
                          : 'w-1.5 bg-white/50 hover:bg-white/70'
                        }
                      `}
                      aria-label={`Фото ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
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
            <div className="absolute inset-0 bg-black/20 z-[3]"></div>
            <div 
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-20"
              style={{ backgroundColor: '#6b7280', opacity: 0.95 }}
            >
              <span className="text-white text-xs font-bold uppercase tracking-wide">Продано</span>
            </div>
          </>
        )}

        {/* Для НЕ проданных авто - NEW бейдж */}
        {!isSold && isNew && (
          <div 
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-20"
            style={{ backgroundColor: '#dc0000', animation: 'pulse-glow 2s ease-in-out infinite' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-wide">New</span>
          </div>
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
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Счетчик фото */}
        {hasMultiplePhotos && (
          <div className="absolute top-3 left-12 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs font-medium z-20">
            {displayIndex + 1}/{car.photos.length}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-base line-clamp-1">
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
