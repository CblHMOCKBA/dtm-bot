'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types';
import { getTelegramWebApp } from '@/lib/telegram';
import { useFavorites } from '@/lib/useFavorites';
import { Heart, Trash2, Car as CarIcon, MessageCircle, X } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { useNavigation } from '@/components/NavigationProvider';
import BottomNavigation from '@/components/BottomNavigation';
import Logo from '@/components/Logo';

export default function FavoritesPage() {
  const router = useRouter();
  const { navigateBack, navigateForward } = useNavigation();
  const { favorites, getFavoritesByType, removeFavorite, clearFavorites, isLoaded } = useFavorites();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigateBack();
        router.push('/');
      });
    }

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router, navigateBack]);

  useEffect(() => {
    if (isLoaded && !loadedRef.current) {
      loadedRef.current = true;
      loadFavorites();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (loadedRef.current) {
      loadFavorites();
    }
  }, [favorites.length]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const carIds = getFavoritesByType('car');
      
      if (carIds.length === 0) {
        setCars([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .in('id', carIds);

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (carId: string) => {
    removeFavorite(carId, 'car');
    setCars(prev => prev.filter(c => c.id !== carId));
    const tg = getTelegramWebApp();
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleClearAll = () => {
    if (confirm('Очистить все избранные автомобили?')) {
      setIsClearing(true);
      setTimeout(() => {
        clearFavorites();
        setCars([]);
        setIsClearing(false);
        const tg = getTelegramWebApp();
        if (tg) {
          tg.HapticFeedback.notificationOccurred('success');
        }
      }, 300);
    }
  };

  const handleContact = () => {
    window.open('https://t.me/dtm_moscow', '_blank');
  };

  const handleCarClick = (carId: string) => {
    navigateForward();
    router.push(`/car/${carId}`);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Шапка - только DTM по центру */}
      <div className="sticky top-0 z-10 border-b border-tg-hint/10"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-center px-4 py-1">
          {/* Логотип DTM по центру */}
          <Logo height={104} />
        </div>

        {/* Заголовок и кнопка очистить */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 fill-current text-red-500" />
              Избранное
            </h2>
            <p className="text-xs text-tg-hint mt-0.5">{cars.length} автомобилей</p>
          </div>
          
          {/* Кнопка очистить в шапке */}
          {cars.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="group relative px-3 py-1.5 rounded-lg bg-tg-secondary-bg/60 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5 transition-all duration-300 active:scale-95 hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-50 overflow-hidden"
            >
              <Trash2 className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Очистить</span>
            </button>
          )}
        </div>
      </div>

      {/* Список */}
      <div className={`px-4 space-y-3 mt-3 transition-opacity duration-300 ${isClearing ? 'opacity-50' : 'opacity-100'}`}>
        {loading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-tg-accent/30 border-t-tg-accent animate-spin mb-3"></div>
            <p className="text-tg-hint text-sm">Загрузка...</p>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-tg-secondary-bg/50 flex items-center justify-center mb-3">
              <Heart className="w-8 h-8 text-tg-hint/50" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">Пока пусто</h3>
            <p className="text-xs text-tg-hint mb-4">
              Добавляйте понравившиеся авто в избранное
            </p>
            <button
              onClick={() => router.push('/')}
              className="tg-button px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 text-sm"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          cars.map((car, index) => (
            <div 
              key={car.id} 
              className="bg-tg-secondary-bg/40 backdrop-blur-sm rounded-xl border border-tg-hint/10 overflow-hidden transition-all duration-300 hover:border-tg-accent/20"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-3">
                <div 
                  className="w-24 h-24 flex-shrink-0 bg-tg-secondary-bg relative cursor-pointer transition-transform duration-300 active:scale-95"
                  onClick={() => handleCarClick(car.id)}
                >
                  {car.photos && car.photos.length > 0 ? (
                    <img
                      src={car.photos[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CarIcon className="w-7 h-7 text-tg-hint" />
                    </div>
                  )}
                </div>

                <div className="flex-1 py-2.5 pr-3 flex flex-col justify-between">
                  <div>
                    <div 
                      className="font-semibold text-white text-sm cursor-pointer hover:text-tg-accent transition-colors"
                      onClick={() => handleCarClick(car.id)}
                    >
                      {car.brand} {car.model}
                    </div>
                    <div className="text-base font-bold text-tg-accent mt-0.5">
                      {formatPrice(car.price)}
                    </div>
                    <div className="text-[11px] text-tg-hint mt-0.5">
                      {car.year} • {car.mileage.toLocaleString()} км
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(car.id)}
                    className="self-start mt-1 flex items-center gap-1 text-[11px] text-red-400/80 hover:text-red-400 transition-all duration-300 active:scale-95"
                  >
                    <X className="w-3 h-3" />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Кнопка обратная связь внизу */}
      {cars.length > 0 && (
        <div className="px-4 mt-5">
          <button
            onClick={handleContact}
            className="group relative w-full py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] overflow-hidden text-sm"
            style={{
              background: 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
              boxShadow: '0 4px 20px rgba(204, 0, 58, 0.3)',
            }}
          >
            <MessageCircle className="w-5 h-5 relative z-10 text-white" />
            <span className="relative z-10 text-white">Обратная связь</span>
          </button>
        </div>
      )}

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
