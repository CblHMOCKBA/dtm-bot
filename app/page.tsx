'use client';

import { useEffect, useState } from 'react';
import { Car, Phone, TrendingUp, Award, CheckCircle, ChevronLeft, ChevronRight, MessageCircle, Heart, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isAdmin, getTelegramWebApp } from '@/lib/telegram';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import { useFavorites } from '@/lib/useFavorites';

// Улучшенная бегущая строка - медленная и без пустоты
function ImprovedMarquee() {
  const text = '⚡ Новые поступления каждую неделю • 🔥 Гарантия качества • 💎 Премиум сервис • ✨ Trade-in с выгодой • 🚀 Быстрое оформление • 🎯 Проверка по базам';
  
  return (
    <div className="relative overflow-hidden py-3 px-4 tg-card">
      <div className="flex gap-12">
        <div className="whitespace-nowrap animate-marquee-slow text-sm font-semibold uppercase tracking-wider text-tg-hint">
          {text} • {text}
        </div>
        <div className="whitespace-nowrap animate-marquee-slow text-sm font-semibold uppercase tracking-wider text-tg-hint" aria-hidden="true">
          {text} • {text}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slow {
          display: inline-block;
          animation: marquee-slow 45s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { count: favoritesCount } = useFavorites();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [topCars, setTopCars] = useState<CarType[]>([]);
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [stats, setStats] = useState({ total: 0, sold: 0, manualSold: 0 });

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
    }

    setIsAdminUser(isAdmin());

    Promise.all([
      loadTopCars(),
      loadStats()
    ]);
  }, []);

  const loadTopCars = async () => {
    try {
      const { data } = await supabase
        .from('cars')
        .select('*')
        .neq('status', 'sold')
        .order('created_at', { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        setTopCars(data);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [totalResult, soldResult, settingsResult] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('settings').select('manual_sold_count').eq('id', 1).single()
      ]);

      setStats({
        total: totalResult.count || 0,
        sold: soldResult.count || 0,
        manualSold: settingsResult.data?.manual_sold_count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const currentCar = topCars[currentCarIndex];
  const totalSold = stats.sold + stats.manualSold;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  return (
    <div className="min-h-screen p-4 relative racing-stripes">
      {/* Контакты */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => router.push('/contact')}
          className="premium-back-button"
          aria-label="Обратная связь"
        >
          <Phone className="w-5 h-5 text-tg-accent" />
        </button>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* DTM Логотип */}
        <div className="flex justify-center pt-2 fade-in">
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-bold brand-name text-tg-accent tracking-[0.3em]">
              DTM
            </h1>
            <div className="text-xs font-semibold tracking-[0.3em] text-tg-white uppercase">
              dtm.moscow
            </div>
          </div>
        </div>

        {/* Подзаголовок */}
        <div className="text-center fade-in">
          <p className="text-sm text-tg-hint font-medium tracking-wider uppercase">
            Премиум автомобили
          </p>
        </div>

        {/* Бегущая строка - ИСПРАВЛЕНО */}
        <ImprovedMarquee />

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 fade-in">
          <button
            onClick={() => router.push('/catalog')}
            className="tg-card p-4 text-center hover:border-tg-accent transition-all active:scale-95 cursor-pointer"
          >
            <div className="text-3xl font-bold text-gradient h-9 flex items-center justify-center">
              {stats.total - stats.sold}
            </div>
            <div className="text-[10px] text-tg-hint mt-2 font-bold uppercase tracking-wide whitespace-nowrap">В наличии</div>
          </button>
          <button
            onClick={() => router.push('/sold')}
            className="tg-card p-4 text-center hover:border-tg-accent transition-all active:scale-95 cursor-pointer"
          >
            <div className="text-3xl font-bold text-gradient h-9 flex items-center justify-center">
              {totalSold}
            </div>
            <div className="text-[10px] text-tg-hint mt-2 font-bold uppercase tracking-wide whitespace-nowrap">Продано</div>
          </button>
          <button
            onClick={() => router.push('/contact')}
            className="tg-card p-4 text-center hover:border-tg-accent transition-all active:scale-95 cursor-pointer"
          >
            <div className="text-3xl font-bold text-gradient h-9 flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div className="text-[10px] text-tg-hint mt-2 font-bold uppercase tracking-wide whitespace-nowrap">Премиум</div>
          </button>
        </div>

        {/* Карусель */}
        {topCars.length > 0 && currentCar && (
          <div className="relative fade-in">
            <div className="text-sm font-bold text-tg-hint mb-3 text-center flex items-center justify-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-5 h-5 text-tg-accent" />
              <span>Топ предложения</span>
            </div>
            <div 
              onClick={() => router.push(`/car/${currentCar.id}`)}
              className="tg-card cursor-pointer transition-all active:scale-[0.98] relative group"
            >
              <div className="aspect-[16/9] bg-tg-bg relative car-image-wrapper">
                {currentCar.photos && currentCar.photos.length > 0 ? (
                  <img
                    src={currentCar.photos[0]}
                    alt={`${currentCar.brand} ${currentCar.model}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-tg-secondary-bg">
                    <Car className="w-20 h-20 text-tg-accent opacity-50" />
                  </div>
                )}
                
                {topCars.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentCarIndex((prev) => (prev - 1 + topCars.length) % topCars.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center transition-all hover:bg-tg-accent hover:scale-110 border border-white/20"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentCarIndex((prev) => (prev + 1) % topCars.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center transition-all hover:bg-tg-accent hover:scale-110 border border-white/20"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 flex gap-2 justify-center">
                      {topCars.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                            index === currentCarIndex 
                              ? 'bg-tg-accent shadow-[0_0_10px_rgba(220,0,0,0.8)] scale-110' 
                              : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-bold text-xl truncate tracking-wide">
                  {currentCar.brand} {currentCar.model}
                </h3>
                <div className="price-display text-2xl text-gradient">
                  {formatPrice(currentCar.price)}
                </div>
                <div className="flex items-center gap-3 text-sm text-tg-hint font-semibold flex-wrap">
                  <span>{currentCar.year}</span>
                  <span className="text-tg-accent">•</span>
                  <span>{currentCar.mileage.toLocaleString()} км</span>
                  {currentCar.specs?.engine && (
                    <>
                      <span className="text-tg-accent">•</span>
                      <span>{currentCar.specs.engine}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Навигация */}
        <div className="space-y-3 fade-in">
          <button
            onClick={() => router.push('/catalog')}
            className="w-full tg-button pulse-button flex items-center justify-center gap-3 py-4 text-base"
          >
            <Car className="w-5 h-5" />
            <span className="font-bold">КАТАЛОГ АВТОМОБИЛЕЙ</span>
          </button>

          <button
            onClick={() => router.push('/contact')}
            className="w-full tg-button-secondary tg-button flex items-center justify-center gap-3 py-4 text-base"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-bold">СВЯЗАТЬСЯ С НАМИ</span>
          </button>

          <button
            onClick={() => router.push('/favorites')}
            className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2 py-3 relative"
          >
            <Heart className="w-5 h-5" />
            <span className="font-semibold">ИЗБРАННОЕ</span>
            {favoritesCount > 0 && (
              <span className="absolute right-4 bg-tg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/sold')}
            className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2 py-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">ПРОДАННЫЕ АВТО</span>
          </button>

          {isAdminUser && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2 py-3"
            >
              <Settings className="w-5 h-5" />
              <span className="font-semibold">ПАНЕЛЬ УПРАВЛЕНИЯ</span>
            </button>
          )}
        </div>

        {/* ПРЕМИУМ СЕРВИС */}
        <div className="relative fade-in overflow-hidden tg-card p-8">
          <div className="relative z-10 space-y-4 text-center">
            <h2 className="text-2xl font-bold brand-name tracking-[0.2em]">
              ПРЕМИУМ СЕРВИС
            </h2>
            <div className="h-px w-20 mx-auto bg-gradient-to-r from-transparent via-tg-accent to-transparent" />
            <p className="text-tg-hint text-sm leading-relaxed max-w-sm mx-auto">
              Полная проверка по базам • Trade-in с выгодой • Оформление под ключ • Гарантия качества
            </p>
            <button
              onClick={() => router.push('/contact')}
              className="tg-button mx-auto px-8 py-3 text-sm"
            >
              УЗНАТЬ ПОДРОБНЕЕ
            </button>
          </div>
        </div>

        {/* Разделитель */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-tg-border to-transparent"></div>

        {/* Подпись автора */}
        <div className="text-center py-4">
          <a 
            href="https://t.me/CblHMOCKBA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-500/50 hover:text-gray-400/70 transition-colors"
          >
            Бота создал @CblHMOCKBA
          </a>
        </div>
      </div>
    </div>
  );
}
