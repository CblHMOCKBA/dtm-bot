'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Grid2X2, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { getTelegramWebApp } from '@/lib/telegram';

export default function SoldPage() {
  const router = useRouter();
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single'); // Новое состояние

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
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading sold cars:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-6 racing-stripes">
      {/* Шапка с DTM брендингом */}
      <div className="sticky top-0 z-20 border-b border-tg-hint/10"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.95), rgba(26, 25, 37, 0.85))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* DTM логотип */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold brand-name text-tg-accent tracking-[0.3em]">
              DTM
            </h1>
            <p className="text-xs text-tg-hint uppercase tracking-wider">Проданные автомобили</p>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            className="premium-back-button"
            aria-label="Переключить вид"
          >
            {viewMode === 'single' ? (
              <Grid2X2 className="w-5 h-5 text-tg-accent" />
            ) : (
              <Square className="w-5 h-5 text-tg-accent" />
            )}
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="px-4 pt-4">
        <div className="max-w-3xl mx-auto">
          {/* Статистика */}
          <div className="mb-6">
            <div className="tg-card p-6 text-center">
              <div className="text-4xl font-bold text-gradient mb-2">
                {totalCount}
              </div>
              <div className="text-sm text-tg-hint uppercase tracking-wider">
                Всего продано автомобилей
              </div>
            </div>
          </div>

          {/* Список */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-tg-hint text-lg mb-2">Пока нет проданных автомобилей</p>
              <button
                onClick={() => router.push('/catalog')}
                className="tg-button mt-4"
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
