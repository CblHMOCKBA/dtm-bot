'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types';
import { getTelegramWebApp, shareCarLink } from '@/lib/telegram';
import { Share2, ChevronLeft, ChevronRight, ArrowLeft, Phone, Calendar, Gauge, Zap, Shield, Crown, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, formatMileage } from '@/lib/formatters';

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isAnimatingRef = useRef(false);
  
  const fromSold = searchParams.get('from') === 'sold';

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        if (fromSold) {
          router.push('/sold');
        } else {
          router.push('/catalog');
        }
      });
    }

    loadCar();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router, params.id, fromSold]);

  const loadCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCar(data);

      const { data: settings } = await supabase
        .from('settings')
        .select('phone')
        .eq('id', 1)
        .single();

      if (settings?.phone && settings.phone.trim()) {
        setPhoneNumber(settings.phone);
      }
    } catch (error) {
      console.error('Error loading car:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (car) {
      const message = `Здравствуйте! Заинтересовался автомобилем:\n\n🚗 ${car.brand} ${car.model}\n📅 Год: ${car.year}\n💰 Цена: ${formatPrice(car.price)}\n📍 Пробег: ${formatMileage(car.mileage)}\n\nХочу узнать подробности!`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://t.me/dtm_moscow?text=${encodedMessage}`, '_blank');
    }
  };

  const handleShare = () => {
    if (car) {
      shareCarLink(car.id, `${car.brand} ${car.model}`);
    }
  };

  const handleCatalog = () => {
    router.push('/catalog');
  };

  // Плавное переключение фото (crossfade)
  const changePhoto = useCallback((newIndex: number) => {
    if (isAnimatingRef.current || !car || !car.photos || car.photos.length === 0 || newIndex === displayIndex) return;
    
    isAnimatingRef.current = true;
    
    setNextIndex(newIndex);
    
    requestAnimationFrame(() => {
      setShowNext(true);
    });
    
    setTimeout(() => {
      setDisplayIndex(newIndex);
      setShowNext(false);
      setNextIndex(null);
      isAnimatingRef.current = false;
    }, 350);
  }, [car, displayIndex]);

  const nextPhoto = useCallback(() => {
    if (car && car.photos.length > 1) {
      const newIndex = (displayIndex + 1) % car.photos.length;
      changePhoto(newIndex);
    }
  }, [car, displayIndex, changePhoto]);

  const prevPhoto = useCallback(() => {
    if (car && car.photos.length > 1) {
      const newIndex = (displayIndex - 1 + car.photos.length) % car.photos.length;
      changePhoto(newIndex);
    }
  }, [car, displayIndex, changePhoto]);

  // Обработка свайпов
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && car && car.photos.length > 1) {
      nextPhoto();
    }
    if (isRightSwipe && car && car.photos.length > 1) {
      prevPhoto();
    }
  };

  const handleIndicatorClick = (index: number) => {
    changePhoto(index);
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      available: { 
        label: 'В наличии', 
        className: 'status-badge status-available',
        icon: <Shield className="w-4 h-4" />
      },
      order: { 
        label: 'Под заказ', 
        className: 'status-badge status-order',
        icon: <Calendar className="w-4 h-4" />
      },
      inTransit: { 
        label: 'В пути', 
        className: 'status-badge status-transit',
        icon: <Gauge className="w-4 h-4" />
      },
      sold: { 
        label: 'Продано', 
        className: 'status-badge status-sold',
        icon: null
      }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.available;
  };

  if (loading) {
    return (
      <div className="min-h-screen racing-stripes">
        <div className="animate-pulse">
          <div className="h-16 bg-tg-secondary-bg/50 border-b border-tg-hint/10"></div>
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-800/50 to-gray-900/50 relative overflow-hidden">
            <div className="skeleton-shimmer absolute inset-0" />
          </div>
          <div className="px-4 pt-4 space-y-4">
            <div className="skeleton-price h-10 w-1/2 rounded-lg"></div>
            <div className="skeleton-text h-6 w-3/4 rounded"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton-button h-12 rounded-xl"></div>
              <div className="skeleton-button h-12 rounded-xl"></div>
            </div>
            <div className="skeleton h-64 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tg-bg to-tg-secondary-bg">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <div className="text-tg-hint text-lg">Автомобиль не найден</div>
        </div>
      </div>
    );
  }

  const isPremiumBrand = ['Mercedes-Benz', 'BMW', 'Porsche', 'Audi', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce'].includes(car.brand);
  const isElectric = car.specs?.fuel === 'electric' || car.specs?.fuel === 'hybrid';
  const statusInfo = getStatusInfo(car.status);
  const hasValidPhotos = car.photos && car.photos.length > 0 && car.photos.some((_, index) => !imageErrors.has(index));

  return (
    <div className="min-h-screen pb-4 relative racing-stripes">
      {/* Premium Header */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-lg z-30 border-b border-tg-accent/20">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => fromSold ? router.push('/sold') : router.push('/catalog')}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-tg-secondary-bg to-tg-carbon flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-tg-accent/20 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:text-tg-accent transition-colors" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#CC003A',
              letterSpacing: '0.3em',
              fontFamily: 'Orbitron, sans-serif',
              textShadow: '0 0 20px rgba(204, 0, 58, 0.5)'
            }}>DTM</h1>
          </div>

          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-tg-secondary-bg to-tg-carbon flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-tg-accent/20 group"
          >
            <Share2 className="w-5 h-5 group-hover:text-tg-accent transition-colors" />
          </button>
        </div>
      </div>

      {/* Premium галерея фото с crossfade анимацией */}
      <div 
        className="relative aspect-[4/3] bg-gradient-to-br from-tg-secondary-bg to-tg-carbon car-image-wrapper group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {hasValidPhotos ? (
          <>
            {/* Основное фото (текущее) */}
            <Image
              src={car.photos[displayIndex]}
              alt={`${car.brand} ${car.model}`}
              fill
              className="object-cover z-[1]"
              sizes="100vw"
              quality={90}
              priority={displayIndex === 0}
              onError={() => handleImageError(displayIndex)}
              draggable={false}
            />
            
            {/* Следующее фото (появляется поверх с анимацией) */}
            {nextIndex !== null && (
              <Image
                src={car.photos[nextIndex]}
                alt={`${car.brand} ${car.model}`}
                fill
                className="object-cover z-[2]"
                sizes="100vw"
                quality={90}
                onError={() => handleImageError(nextIndex)}
                draggable={false}
                style={{
                  opacity: showNext ? 1 : 0,
                  transition: 'opacity 300ms ease-in-out',
                }}
              />
            )}
            
            {/* Premium overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[3]"></div>
            
            {car.photos.length > 1 && (
              <>
                {/* Premium navigation buttons */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-tg-accent hover:scale-110 border border-white/20 z-10"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-tg-accent hover:scale-110 border border-white/20 z-10"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
                
                {/* Premium indicators с кликом */}
                <div className="absolute bottom-4 left-0 right-0 flex gap-2 justify-center z-10">
                  {car.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleIndicatorClick(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === displayIndex 
                          ? 'w-10 bg-tg-accent shadow-[0_0_10px_rgba(220,0,0,0.8)] scale-110' 
                          : 'w-6 bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Premium Status badges - только Premium и Эко */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
              {isPremiumBrand && (
                <div className="premium-badge flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </div>
              )}
              {isElectric && (
                <div className="premium-badge flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Эко
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-tg-hint bg-gradient-to-br from-tg-secondary-bg via-tg-bg to-tg-secondary-bg">
            <div className="relative">
              <div className="absolute inset-0 bg-tg-accent/20 blur-2xl animate-pulse"></div>
              <svg className="w-24 h-24 text-tg-accent relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm mt-4 font-bold uppercase tracking-wider">Фото скоро появится</p>
          </div>
        )}
      </div>

      {/* Premium информация */}
      <div className="px-4 pt-4 space-y-4">
        <div className="price-display text-4xl text-gradient animate-gradient-shift">
          {formatPrice(car.price)}
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-wide brand-name">
            {car.brand} {car.model}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleContact}
            className="tg-button pulse-button flex items-center justify-center gap-2 py-4 text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
              boxShadow: '0 4px 20px rgba(204, 0, 58, 0.4)',
            }}
          >
            <MessageCircle className="w-5 h-5" />
            <span>НАПИСАТЬ</span>
          </button>
          <button
            onClick={() => window.open(`tel:${phoneNumber.replace(/\s+/g, '')}`, '_blank')}
            className="tg-button-secondary tg-button flex items-center justify-center gap-2 py-4 text-base font-bold"
          >
            <Phone className="w-5 h-5" />
            <span>ПОЗВОНИТЬ</span>
          </button>
        </div>

        {/* Характеристики */}
        <div className="tg-card p-5 space-y-4">
          <h2 className="text-lg font-bold tracking-wide uppercase text-gradient text-center pt-2">Характеристики</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
              <span className="text-tg-hint flex items-center gap-2">
                <Calendar className="w-4 h-4 text-tg-accent" />
                Год
              </span>
              <span className="font-bold text-lg">{car.year}</span>
            </div>
            
            {car.mileage > 0 && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-tg-accent" />
                  Пробег
                </span>
                <span className="font-bold text-lg">{formatMileage(car.mileage)}</span>
              </div>
            )}

            {car.specs?.power && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Мощность</span>
                <span className="font-bold text-lg">{car.specs.power}</span>
              </div>
            )}
            
            {car.specs?.engine && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Объём двигателя</span>
                <span className="font-bold text-lg">{car.specs.engine}</span>
              </div>
            )}
            
            {car.specs?.fuel && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Топливо</span>
                <span className="font-bold text-lg capitalize">{car.specs.fuel}</span>
              </div>
            )}

            {car.specs?.transmission && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Коробка передач</span>
                <span className="font-bold text-lg">{car.specs.transmission}</span>
              </div>
            )}

            {car.specs?.drive && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Привод</span>
                <span className="font-bold text-lg">{car.specs.drive}</span>
              </div>
            )}

            {car.specs?.color && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Цвет</span>
                <span className="font-bold text-lg">{car.specs.color}</span>
              </div>
            )}

            {car.specs?.body_type && (
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint">Кузов</span>
                <span className="font-bold text-lg">{car.specs.body_type}</span>
              </div>
            )}
          </div>
        </div>

        {/* Описание */}
        {car.description && car.description.trim() && (
          <div className="tg-card p-5 space-y-3">
            <h2 className="text-lg font-bold tracking-wide uppercase text-gradient text-center pt-2">Описание</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap px-2">
              {car.description}
            </p>
          </div>
        )}

        {/* CTA кнопка */}
        <button
          onClick={handleCatalog}
          className="w-full tg-button py-4 text-lg flex items-center justify-center gap-3 group"
        >
          <span className="font-bold">Посмотреть другие автомобили</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-tg-accent/50 to-transparent"></div>
    </div>
  );
}
