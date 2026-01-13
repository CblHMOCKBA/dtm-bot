'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types';
import { getTelegramWebApp, shareCarLink } from '@/lib/telegram';
import { Share2, ArrowLeft, Phone, MessageCircle, Zap, Gauge, Settings2, Palette, Car as CarIcon } from 'lucide-react';
import { formatPrice, formatMileage } from '@/lib/formatters';
import { useNavigation } from '@/components/NavigationProvider';
import CarCard from '@/components/CarCard';

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigateBack, navigateForward } = useNavigation();
  const [car, setCar] = useState<Car | null>(null);
  const [otherCars, setOtherCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Drag state для галереи
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  const fromSold = searchParams.get('from') === 'sold';

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigateBack();
        if (fromSold) {
          router.push('/sold');
        } else {
          router.push('/');
        }
      });
    }

    loadCar();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router, params.id, fromSold, navigateBack]);

  // Mouse drag handlers для галереи
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  const loadCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCar(data);

      // Загружаем другие авто (кроме текущего)
      const { data: others } = await supabase
        .from('cars')
        .select('*')
        .neq('id', params.id)
        .neq('status', 'sold')
        .order('created_at', { ascending: false })
        .limit(6);

      if (others) {
        setOtherCars(others);
      }

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

  const handleCall = () => {
    window.open(`tel:${phoneNumber.replace(/\s+/g, '')}`, '_blank');
  };

  const handleShare = () => {
    if (car) {
      shareCarLink(car.id, `${car.brand} ${car.model}`);
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };

  const handleGoBack = () => {
    navigateBack();
    if (fromSold) {
      router.push('/sold');
    } else {
      router.push('/');
    }
  };

  const handleCarClick = (carId: string) => {
    navigateForward();
    router.push(`/car/${carId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="animate-pulse">
          <div className="h-16 bg-black/30 border-b border-tg-hint/10"></div>
          <div className="aspect-[4/3] bg-black/30 relative overflow-hidden">
            <div className="skeleton-shimmer absolute inset-0" />
          </div>
          <div className="px-4 pt-4 space-y-4">
            <div className="skeleton-text h-6 w-3/4 rounded"></div>
            <div className="skeleton-price h-10 w-1/2 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-20 rounded-xl"></div>
              <div className="skeleton h-20 rounded-xl"></div>
              <div className="skeleton h-20 rounded-xl"></div>
              <div className="skeleton h-20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <div className="text-tg-hint text-lg">Автомобиль не найден</div>
        </div>
      </div>
    );
  }

  const isElectric = car.specs?.fuel === 'electric' || car.specs?.fuel === 'hybrid';
  const hasValidPhotos = car.photos && car.photos.length > 0 && car.photos.some((_, index) => !imageErrors.has(index));
  const isSold = car.status === 'sold';

  // Форматируем трансмиссию
  const getTransmissionLabel = (trans?: string) => {
    if (!trans) return null;
    const t = trans.toLowerCase();
    if (t.includes('автомат') || t.includes('акпп') || t.includes('auto')) return 'Автомат';
    if (t.includes('робот')) return 'Робот';
    if (t.includes('вариатор') || t.includes('cvt')) return 'Вариатор';
    if (t.includes('механ') || t.includes('мкпп') || t.includes('manual')) return 'Механика';
    return trans;
  };

  // Форматируем привод
  const getDriveLabel = (drive?: string) => {
    if (!drive) return null;
    const d = drive.toLowerCase();
    if (d.includes('полн') || d.includes('4wd') || d.includes('awd') || d.includes('4x4')) return 'Полный';
    if (d.includes('перед')) return 'Передний';
    if (d.includes('задн')) return 'Задний';
    return drive;
  };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-tg-accent/15"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleGoBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 hover:border-white/30 hover:bg-white/10 group overflow-hidden"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 
              className="text-2xl font-black tracking-[0.15em]"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                color: 'white',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
              }}
            >DTM</h1>
          </div>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 hover:border-white/30 hover:bg-white/10 group overflow-hidden"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Галерея фото со свайпом */}
      <div className="relative aspect-[4/3] bg-black/30 overflow-hidden">
        {hasValidPhotos ? (
          <>
            <div 
              ref={scrollRef}
              className="photo-gallery w-full h-full"
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
                  <img
                    src={photo}
                    alt={`${car.brand} ${car.model} - фото ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    onError={() => handleImageError(index)}
                  />
                </div>
              ))}
            </div>

            {/* Эко бейдж для электрокаров */}
            {isElectric && (
              <div className="absolute top-4 right-4 z-10">
                <div className="premium-badge flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Эко
                </div>
              </div>
            )}
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

      {/* Информация о машине */}
      <div className="px-4 pt-4 space-y-4">
        {/* Название и год */}
        <div>
          <h1 className="text-xl font-bold">
            {car.brand} {car.model}, {car.year}
          </h1>
        </div>

        {/* Цена */}
        <div className="text-3xl font-bold">
          {formatPrice(car.price)}
        </div>

        {/* Компактные характеристики - сетка 2x2 как на auto.ru */}
        <div className="border-t border-tg-hint/20 pt-4">
          <h3 className="text-base font-bold mb-3">Характеристики</h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Мощность */}
            {car.specs?.power && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-tg-secondary-bg flex items-center justify-center flex-shrink-0">
                  <Gauge className="w-4 h-4 text-tg-accent" />
                </div>
                <div>
                  <div className="font-bold text-sm">{car.specs.power}</div>
                  <div className="text-xs text-tg-hint">
                    {car.specs?.engine && `${car.specs.engine}, `}
                    {car.specs?.fuel || 'Бензин'}
                  </div>
                </div>
              </div>
            )}

            {/* Коробка */}
            {car.specs?.transmission && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-tg-secondary-bg flex items-center justify-center flex-shrink-0">
                  <Settings2 className="w-4 h-4 text-tg-accent" />
                </div>
                <div>
                  <div className="font-bold text-sm">{getTransmissionLabel(car.specs.transmission)}</div>
                  <div className="text-xs text-tg-hint">коробка</div>
                </div>
              </div>
            )}

            {/* Привод */}
            {car.specs?.drive && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-tg-secondary-bg flex items-center justify-center flex-shrink-0">
                  <CarIcon className="w-4 h-4 text-tg-accent" />
                </div>
                <div>
                  <div className="font-bold text-sm">{getDriveLabel(car.specs.drive)}</div>
                  <div className="text-xs text-tg-hint">привод</div>
                </div>
              </div>
            )}

            {/* Цвет */}
            {car.specs?.color && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-tg-secondary-bg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-4 h-4 text-tg-accent" />
                </div>
                <div>
                  <div className="font-bold text-sm">{car.specs.color}</div>
                  <div className="text-xs text-tg-hint">цвет</div>
                </div>
              </div>
            )}
          </div>

          {/* Дополнительные характеристики в строку */}
          <div className="mt-4 space-y-2 text-sm">
            {car.specs?.body_type && (
              <div className="flex justify-between py-2 border-b border-tg-hint/10">
                <span className="text-tg-hint">Кузов</span>
                <span className="font-medium">{car.specs.body_type}</span>
              </div>
            )}
            {car.mileage > 0 && (
              <div className="flex justify-between py-2 border-b border-tg-hint/10">
                <span className="text-tg-hint">Пробег</span>
                <span className="font-medium">{formatMileage(car.mileage)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Описание */}
        {car.description && car.description.trim() && (
          <div className="pt-4">
            <h3 className="text-base font-bold mb-2">Описание</h3>
            <p className="text-sm text-tg-hint leading-relaxed whitespace-pre-wrap">
              {car.description}
            </p>
          </div>
        )}

        {/* Другие автомобили */}
        {otherCars.length > 0 && (
          <div className="border-t border-tg-hint/20 pt-4">
            <h3 className="text-base font-bold mb-3">Другие автомобили</h3>
            <div className="grid grid-cols-1 gap-4">
              {otherCars.map((otherCar) => (
                <CarCard 
                  key={otherCar.id} 
                  car={otherCar} 
                  onClick={() => handleCarClick(otherCar.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Закреплённые кнопки снизу */}
      {!isSold && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-tg-accent/15 px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.6), rgba(26, 25, 37, 0.5))',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            <button
              onClick={handleContact}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all active:scale-95 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
                boxShadow: '0 4px 15px rgba(204, 0, 58, 0.3)',
              }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm tracking-wide uppercase">Написать</span>
            </button>
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-tg-hint/30 transition-all active:scale-95 hover:border-tg-accent/50 overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <Phone className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm tracking-wide uppercase">Позвонить</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
