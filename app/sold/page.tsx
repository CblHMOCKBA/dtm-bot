'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Grid2X2, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { getTelegramWebApp } from '@/lib/telegram';

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
    <div className="min-h-screen pb-6">
      {/* Шапка с DTM брендингом */}
      <div className="sticky top-0 z-20 border-b border-tg-hint/10"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 hover:border-white/30 hover:bg-white/10 group overflow-hidden"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* DTM логотип */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold brand-name text-tg-accent tracking-[0.3em]">
              DTM
            </h1>
            <p className="text-xs text-tg-hint uppercase tracking-wider">Проданные автомобили</p>
          </div>

          <div className="w-10"></div>
        </div>

        {/* Поиск + Кнопка вида */}
        <div className="px-4 pb-3 flex gap-2">
          <input
            type="text"
            placeholder="Поиск по марке, модели..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 tg-input"
          />
          
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            className="w-11 h-11 flex items-center justify-center tg-card hover:border-tg-accent transition-all active:scale-95"
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
        <div className="px-4 pb-3">
          <div className="text-sm text-tg-hint text-center">
            {filteredCars.length === 0 && !loading && 'Ничего не найдено'}
            {filteredCars.length > 0 && `Найдено: ${filteredCars.length} из ${totalCount} проданных`}
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="px-4 pt-4">
        <div className="max-w-3xl mx-auto">
          {/* Список */}
          {loading ? (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {[1, 2, 3, 4].map((i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-tg-hint text-lg mb-2">
                {searchQuery ? 'Ничего не найдено' : 'Пока нет проданных автомобилей'}
              </p>
              <button
                onClick={() => searchQuery ? setSearchQuery('') : router.push('/catalog')}
                className="tg-button mt-4"
              >
                {searchQuery ? 'Сбросить поиск' : 'Перейти в каталог'}
              </button>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
