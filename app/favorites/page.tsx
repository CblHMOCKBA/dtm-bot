'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types';
import { getTelegramWebApp } from '@/lib/telegram';
import { useFavorites } from '@/lib/useFavorites';
import { ArrowLeft, Phone, Heart, Trash2, Car as CarIcon } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import Image from 'next/image';

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, getFavoritesByType, removeFavorite, clearFavorites, isLoaded } = useFavorites();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/'));
    }

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  useEffect(() => {
    if (isLoaded && !loadedRef.current) {
      loadedRef.current = true;
      loadFavorites();
    }
  }, [isLoaded]);

  // Отдельный эффект для обновления при изменении favorites
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
    if (confirm('Очистить все избранные?')) {
      clearFavorites();
      setCars([]);
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-md z-10 border-b border-tg-hint/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />

          <button
            onClick={() => window.open(`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || '+79806790176'}`, '_blank')}
            className="w-10 h-10 rounded-full bg-tg-accent/10 flex items-center justify-center text-tg-accent"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <Heart className="w-6 h-6 fill-current text-red-500" />
              Избранное
            </h1>
            <p className="text-sm text-tg-hint mt-1">{cars.length} автомобилей</p>
          </div>
          
          {cars.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Список */}
      <div className="px-4 space-y-3 mt-4">
        {loading ? (
          <div className="text-center py-12 text-tg-hint">Загрузка...</div>
        ) : cars.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-tg-secondary-bg flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-tg-hint" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Пока пусто</h3>
            <p className="text-sm text-tg-hint mb-6">
              Добавляйте понравившиеся авто в избранное
            </p>
            <button
              onClick={() => router.push('/catalog')}
              className="tg-button px-6 py-3"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          cars.map((car) => (
            <div 
              key={car.id} 
              className="tg-card overflow-hidden"
            >
              <div className="flex gap-3">
                {/* Фото */}
                <div 
                  className="w-28 h-28 flex-shrink-0 bg-tg-secondary-bg relative cursor-pointer"
                  onClick={() => router.push(`/car/${car.id}`)}
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

                {/* Информация */}
                <div className="flex-1 py-3 pr-3">
                  <div 
                    className="font-semibold cursor-pointer hover:text-tg-accent transition-colors"
                    onClick={() => router.push(`/car/${car.id}`)}
                  >
                    {car.brand} {car.model}
                  </div>
                  <div className="text-lg font-bold text-gradient mt-1 whitespace-nowrap">
                    {formatPrice(car.price)}
                  </div>
                  <div className="text-xs text-tg-hint mt-1">
                    {car.year} • {car.mileage.toLocaleString()} км
                  </div>

                  {/* Кнопка удаления */}
                  <button
                    onClick={() => handleRemove(car.id)}
                    className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
