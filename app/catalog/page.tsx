'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { getTelegramWebApp } from '@/lib/telegram';

export default function CatalogPage() {
  const router = useRouter();
  const [cars, setCars] = useState<CarType[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Фильтры
  const [filterBrand, setFilterBrand] = useState('');
  const [filterYearFrom, setFilterYearFrom] = useState('');
  const [filterYearTo, setFilterYearTo] = useState('');
  const [filterPriceFrom, setFilterPriceFrom] = useState('');
  const [filterPriceTo, setFilterPriceTo] = useState('');

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/'));
    }

    loadCars();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [cars, searchQuery, filterBrand, filterYearFrom, filterYearTo, filterPriceFrom, filterPriceTo]);

  const loadCars = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .neq('status', 'sold')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCars(data || []);
      setFilteredCars(data || []);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cars];

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query)
      );
    }

    // Фильтр по марке
    if (filterBrand) {
      filtered = filtered.filter(car => 
        car.brand.toLowerCase() === filterBrand.toLowerCase()
      );
    }

    // Фильтр по году
    if (filterYearFrom) {
      filtered = filtered.filter(car => car.year >= parseInt(filterYearFrom));
    }
    if (filterYearTo) {
      filtered = filtered.filter(car => car.year <= parseInt(filterYearTo));
    }

    // Фильтр по цене
    if (filterPriceFrom) {
      filtered = filtered.filter(car => car.price >= parseInt(filterPriceFrom));
    }
    if (filterPriceTo) {
      filtered = filtered.filter(car => car.price <= parseInt(filterPriceTo));
    }

    setFilteredCars(filtered);
  };

  const resetFilters = () => {
    setFilterBrand('');
    setFilterYearFrom('');
    setFilterYearTo('');
    setFilterPriceFrom('');
    setFilterPriceTo('');
    setSearchQuery('');
  };

  // Получаем уникальные марки
  const uniqueBrands = Array.from(new Set(cars.map(car => car.brand))).sort();

  return (
    <div className="min-h-screen pb-6 racing-stripes">
      {/* Шапка */}
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

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold brand-name text-tg-accent tracking-[0.3em]">
              DTM
            </h1>
            <p className="text-xs text-tg-hint uppercase tracking-wider">Каталог автомобилей</p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="premium-back-button"
            aria-label="Фильтры"
          >
            <SlidersHorizontal className="w-5 h-5 text-tg-accent" />
          </button>
        </div>

        {/* Поиск */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Поиск по марке, модели..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tg-input"
          />
        </div>

        {/* Счётчик */}
        <div className="px-4 pb-3">
          <div className="text-sm text-tg-hint text-center">
            {filteredCars.length === 0 && !loading && 'Ничего не найдено'}
            {filteredCars.length > 0 && `Найдено: ${filteredCars.length} авто`}
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="fixed inset-0 z-30 flex items-end justify-center"
          style={{
            background: 'rgba(4, 3, 14, 0.85)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowFilters(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-2xl p-6 space-y-4"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
              backdropFilter: 'blur(20px)',
              borderTop: '2px solid rgba(204, 0, 58, 0.3)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold brand-name">ФИЛЬТРЫ</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:bg-tg-accent/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Марка */}
            <div>
              <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Марка</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="tg-input"
              >
                <option value="">Все марки</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Год */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Год от</label>
                <input
                  type="number"
                  placeholder="2010"
                  value={filterYearFrom}
                  onChange={(e) => setFilterYearFrom(e.target.value)}
                  className="tg-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Год до</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={filterYearTo}
                  onChange={(e) => setFilterYearTo(e.target.value)}
                  className="tg-input"
                />
              </div>
            </div>

            {/* Цена */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Цена от</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={filterPriceFrom}
                  onChange={(e) => setFilterPriceFrom(e.target.value)}
                  className="tg-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Цена до</label>
                <input
                  type="number"
                  placeholder="10000000"
                  value={filterPriceTo}
                  onChange={(e) => setFilterPriceTo(e.target.value)}
                  className="tg-input"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={resetFilters}
                className="tg-button-secondary tg-button"
              >
                Сбросить
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="tg-button"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Контент */}
      <div className="px-4 pt-4">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-tg-hint text-lg mb-2">Автомобили не найдены</p>
              <button
                onClick={resetFilters}
                className="tg-button mt-4"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  onClick={() => router.push(`/car/${car.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
