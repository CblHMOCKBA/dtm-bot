'use client';

import { useEffect, useState } from 'react';
import { Grid2X2, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { getTelegramWebApp } from '@/lib/telegram';
import BottomNavigation from '@/components/BottomNavigation';
import Logo from '@/components/Logo';

export default function SoldPage() {
  const router = useRouter();
  const [cars, setCars] = useState<CarType[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/'));
    }

    loadSoldCars();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  useEffect(() => {
    applySearch();
  }, [cars, searchQuery]);

  const loadSoldCars = async () => {
    try {
      setLoading(true);

      const { data, error, count } = await supabase
        .from('cars')
        .select('*', { count: 'exact' })
        .eq('status', 'sold')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCars(data || []);
      setFilteredCars(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading sold cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = cars.filter(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query)
      );
      setFilteredCars(filtered);
    } else {
      setFilteredCars(cars);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Шапка - только DTM */}
      <div className="sticky top-0 z-20 border-b border-tg-hint/10"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-center px-4 py-1">
          {/* DTM логотип по центру */}
          <div className="text-center">
            <Logo height={104} className="mx-auto mb-1" />
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#9CA3AF' }}>Проданные автомобили</p>
          </div>
        </div>

        {/* Поиск + Кнопка вида */}
        <div className="px-4 pb-3 flex gap-2">
          <input
            type="text"
            placeholder="Поиск по марке, модели..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 tg-input text-sm"
          />
          
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            className="w-10 h-10 flex items-center justify-center tg-card hover:border-tg-accent transition-all active:scale-95"
            aria-label="Переключить вид"
          >
            {viewMode === 'single' ? (
              <Grid2X2 className="w-5 h-5 text-tg-accent" />
            ) : (
              <LayoutGrid className="w-5 h-5 text-tg-accent" />
            )}
          </button>
        </div>

        {/* Счётчик */}
        <div className="px-4 pb-2">
          <div className="text-xs text-tg-hint text-center">
            {filteredCars.length === 0 && !loading && 'Ничего не найдено'}
            {filteredCars.length > 0 && `Найдено: ${filteredCars.length} из ${totalCount} проданных`}
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="px-4 pt-3">
        <div className="max-w-3xl mx-auto">
          {/* Список */}
          {loading ? (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              {[1, 2, 3, 4].map((i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-tg-hint text-base mb-2">
                {searchQuery ? 'Ничего не найдено' : 'Пока нет проданных автомобилей'}
              </p>
              <button
                onClick={() => searchQuery ? setSearchQuery('') : router.push('/catalog')}
                className="tg-button mt-3 text-sm"
              >
                {searchQuery ? 'Сбросить поиск' : 'Перейти в каталог'}
              </button>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
