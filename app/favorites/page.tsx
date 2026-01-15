'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types';
import { getTelegramWebApp } from '@/lib/telegram';
import { useFavorites } from '@/lib/useFavorites';
import { Phone, Heart, Trash2, Car as CarIcon, MessageCircle, X } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { useNavigation } from '@/components/NavigationProvider';
import BottomNavigation from '@/components/BottomNavigation';

export default function FavoritesPage() {
  const router = useRouter();
  const { navigateBack, navigateForward } = useNavigation();
  const { favorites, getFavoritesByType, removeFavorite, clearFavorites, isLoaded } = useFavorites();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const [telegramUsername, setTelegramUsername] = useState('dtm_moscow');
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

    loadSettings();

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

  const loadSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('phone, telegram')
        .eq('id', 1)
        .single();

      if (settings?.phone && settings.phone.trim()) {
        setPhoneNumber(settings.phone);
      }
      if (settings?.telegram && settings.telegram.trim()) {
        setTelegramUsername(settings.telegram.replace('@', ''));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

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

  const handleCall = () => {
    window.open(`tel:${phoneNumber.replace(/\s+/g, '')}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/${telegramUsername}`, '_blank');
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
      {/* Шапка */}
      <div className="sticky top-0 z-10 border-b border-tg-hint/10"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Кнопка Telegram слева */}
          <button
            onClick={handleTelegram}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-tg-accent/50 hover:bg-white/10 group"
            aria-label="Написать в Telegram"
          >
            <MessageCircle className="w-5 h-5 text-white group-hover:text-tg-accent transition-colors" />
          </button>

          {/* Логотип DTM по центру */}
          <h1 
            className="text-2xl font-black tracking-[0.15em]"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              color: 'white',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
            }}
          >DTM</h1>

          {/* Кнопка звонка справа */}
          <button
            onClick={handleCall}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-tg-accent/50 hover:bg-white/10 group"
            aria-label="Позвонить"
          >
            <Phone className="w-5 h-5 text-white group-hover:text-tg-accent transition-colors" />
          </button>
        </div>

        {/* Заголовок и кнопка очистить */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
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
              className="group relative px-4 py-2 rounded-xl bg-tg-secondary-bg/60 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 transition-all duration-300 active:scale-95 hover:bg-red-500/10 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] disabled:opacity-50 overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <Trash2 className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Очистить</span>
            </button>
          )}
        </div>
      </div>

      {/* Список */}
      <div className={`px-4 space-y-3 mt-4 transition-opacity duration-300 ${isClearing ? 'opacity-50' : 'opacity-100'}`}>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-tg-accent/30 border-t-tg-accent animate-spin mb-4"></div>
            <p className="text-tg-hint">Загрузка...</p>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-tg-secondary-bg/50 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-tg-hint/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Пока пусто</h3>
            <p className="text-sm text-tg-hint mb-6">
              Добавляйте понравившиеся авто в избранное
            </p>
            <button
              onClick={() => router.push('/')}
              className="tg-button px-6 py-3 rounded-xl transition-all duration-300 active:scale-95 hover:scale-[1.02]"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          cars.map((car, index) => (
            <div 
              key={car.id} 
              className="bg-tg-secondary-bg/40 backdrop-blur-sm rounded-xl border border-tg-hint/10 overflow-hidden transition-all duration-300 hover:border-tg-accent/20 hover:bg-tg-secondary-bg/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-3">
                <div 
                  className="w-28 h-28 flex-shrink-0 bg-tg-secondary-bg relative cursor-pointer transition-transform duration-300 active:scale-95"
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
                      <CarIcon className="w-8 h-8 text-tg-hint" />
                    </div>
                  )}
                </div>

                <div className="flex-1 py-3 pr-3 flex flex-col justify-between">
                  <div>
                    <div 
                      className="font-semibold text-white cursor-pointer hover:text-tg-accent transition-colors"
                      onClick={() => handleCarClick(car.id)}
                    >
                      {car.brand} {car.model}
                    </div>
                    <div className="text-lg font-bold text-tg-accent mt-0.5">
                      {formatPrice(car.price)}
                    </div>
                    <div className="text-xs text-tg-hint mt-0.5">
                      {car.year} • {car.mileage.toLocaleString()} км
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(car.id)}
                    className="self-start mt-1 flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 transition-all duration-300 active:scale-95 group"
                  >
                    <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Кнопки снизу */}
      {cars.length > 0 && (
        <div className="px-4 mt-6 space-y-3">
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="group relative w-full py-3.5 flex items-center justify-center gap-2 rounded-xl bg-tg-secondary-bg/40 border border-red-500/20 text-red-400 font-medium transition-all duration-300 active:scale-[0.98] hover:bg-red-500/10 hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)] disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <Trash2 className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">{isClearing ? 'Очистка...' : 'Очистить избранное'}</span>
          </button>
          
          <button
            onClick={handleContact}
            className="group relative w-full py-4 flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] hover:scale-[1.01] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
              boxShadow: '0 4px 20px rgba(204, 0, 58, 0.3)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
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
