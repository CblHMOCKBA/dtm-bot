'use client';

import { useEffect, useState } from 'react';
import { Car, Phone, MessageCircle, SlidersHorizontal, Heart, BarChart3, Settings, Grid2X2, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isAdmin, getTelegramWebApp } from '@/lib/telegram';
import { supabase } from '@/lib/supabase';
import { Car as CarType, CarStatus } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { useFavorites } from '@/lib/useFavorites';

export default function Home() {
  const router = useRouter();
  const { count: favoritesCount } = useFavorites();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [cars, setCars] = useState<CarType[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | CarStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, sold: 0, manualSold: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
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
      tg.expand();
    }

    setIsAdminUser(isAdmin());

    Promise.all([
      loadCars(),
      loadStats()
    ]);

    // Scroll handler
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    applyFilters();
  }, [cars, statusFilter, searchQuery, filterBrand, filterYearFrom, filterYearTo, filterPriceFrom, filterPriceTo]);

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
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
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

  const applyFilters = () => {
    let filtered = [...cars];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => car.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query)
      );
    }

    if (filterBrand) {
      filtered = filtered.filter(car => 
        car.brand.toLowerCase() === filterBrand.toLowerCase()
      );
    }

    if (filterYearFrom) {
      filtered = filtered.filter(car => car.year >= parseInt(filterYearFrom));
    }
    if (filterYearTo) {
      filtered = filtered.filter(car => car.year <= parseInt(filterYearTo));
    }

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
    setStatusFilter('all');
    setSearchQuery('');
  };

  const uniqueBrands = Array.from(new Set(cars.map(car => car.brand))).sort();

  const statusButtons: { value: 'all' | CarStatus; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'available', label: 'В наличии' },
    { value: 'order', label: 'Под заказ' },
    { value: 'inTransit', label: 'В пути' }
  ];

  const totalSold = stats.sold + stats.manualSold;

  return (
    <div className="min-h-screen pb-20 racing-stripes">
      {/* Шапка */}
      <div 
        className={`fixed top-0 left-0 right-0 z-20 border-b border-tg-hint/10 transition-transform duration-300 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* DTM лого + Контакты */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex-1"></div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold brand-name text-tg-accent tracking-[0.3em]">
              DTM
            </h1>
            <p className="text-xs text-tg-hint mt-1">
              {filteredCars.length} {statusFilter === 'all' ? 'предложений' : 'автомобилей'}
            </p>
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={() => router.push('/contact')}
              className="premium-icon-button-compact group"
              aria-label="Контакты"
            >
              <MessageCircle className="w-5 h-5 text-tg-accent transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Вкладки статусов */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {statusButtons.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`premium-status-tab ${statusFilter === status.value ? 'active' : ''}`}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="relative z-10">{status.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Поиск + Кнопки */}
        <div className="px-4 pb-4 flex gap-2">
          <input
            type="text"
            placeholder="Марка, модель, год..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 premium-search-input"
          />
          
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            className="premium-square-button group"
            aria-label="Переключить вид"
          >
            {viewMode === 'single' ? (
              <Grid2X2 className="w-5 h-5 text-tg-accent transition-transform group-hover:rotate-90 duration-300" />
            ) : (
              <LayoutGrid className="w-5 h-5 text-tg-accent transition-transform group-hover:rotate-90 duration-300" />
            )}
          </button>

          <button
            onClick={() => setShowFilters(true)}
            className="premium-square-button group"
            aria-label="Фильтры"
          >
            <SlidersHorizontal className="w-5 h-5 text-tg-accent transition-transform group-hover:rotate-90 duration-300" />
          </button>
        </div>

        {/* Активные фильтры */}
        {(filterBrand || filterYearFrom || filterYearTo || filterPriceFrom || filterPriceTo) && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {filterBrand && (
                <div className="premium-active-badge group">
                  <span>{filterBrand}</span>
                  <button onClick={() => setFilterBrand('')} className="hover:scale-125 transition-transform">×</button>
                </div>
              )}
              {(filterYearFrom || filterYearTo) && (
                <div className="premium-active-badge group">
                  <span>{filterYearFrom || '...'} - {filterYearTo || '...'}</span>
                  <button onClick={() => { setFilterYearFrom(''); setFilterYearTo(''); }} className="hover:scale-125 transition-transform">×</button>
                </div>
              )}
              {(filterPriceFrom || filterPriceTo) && (
                <div className="premium-active-badge group">
                  <span>
                    {filterPriceFrom ? `${(parseInt(filterPriceFrom) / 1000000).toFixed(1)}М` : '...'} - {filterPriceTo ? `${(parseInt(filterPriceTo) / 1000000).toFixed(1)}М` : '...'}
                  </span>
                  <button onClick={() => { setFilterPriceFrom(''); setFilterPriceTo(''); }} className="hover:scale-125 transition-transform">×</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[200px]"></div>

      {/* Панель фильтров */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-30 flex items-end justify-center animate-fade-in"
          style={{
            background: 'rgba(4, 3, 14, 0.9)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowFilters(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-3xl p-6 space-y-4 animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
              backdropFilter: 'blur(20px)',
              borderTop: '2px solid rgba(204, 0, 58, 0.5)',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(204, 0, 58, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold brand-name text-tg-accent">ФИЛЬТРЫ</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:bg-tg-accent/20 hover:rotate-90 duration-300 border border-tg-accent/30"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Марка</label>
              <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="premium-select">
                <option value="">Все марки</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Год от</label>
                <input type="number" placeholder="2010" value={filterYearFrom} onChange={(e) => setFilterYearFrom(e.target.value)} className="premium-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Год до</label>
                <input type="number" placeholder="2024" value={filterYearTo} onChange={(e) => setFilterYearTo(e.target.value)} className="premium-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Цена от</label>
                <input type="number" placeholder="1000000" value={filterPriceFrom} onChange={(e) => setFilterPriceFrom(e.target.value)} className="premium-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Цена до</label>
                <input type="number" placeholder="10000000" value={filterPriceTo} onChange={(e) => setFilterPriceTo(e.target.value)} className="premium-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={resetFilters} className="premium-filter-reset-button">
                Сбросить
              </button>
              <button onClick={() => setShowFilters(false)} className="premium-filter-apply-button">
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Каталог */}
      <div className="px-4">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {[1, 2, 3, 4].map((i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <Car className="w-16 h-16 mx-auto mb-4 text-tg-hint opacity-50 animate-pulse" />
              <p className="text-tg-hint text-lg mb-2">Автомобили не найдены</p>
              <button onClick={resetFilters} className="tg-button mt-4">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
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

      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-tg-accent/30"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -5px 30px rgba(204, 0, 58, 0.2)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-3xl mx-auto">
          <button className="premium-nav-button active">
            <Car className="w-6 h-6" />
            <span className="text-xs font-semibold">Каталог</span>
          </button>

          <button onClick={() => router.push('/favorites')} className="premium-nav-button">
            <Heart className="w-6 h-6" />
            {favoritesCount > 0 && (
              <span className="absolute top-1 right-2 bg-tg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse-scale">
                {favoritesCount}
              </span>
            )}
            <span className="text-xs font-semibold">Избранное</span>
          </button>

          <button onClick={() => router.push('/sold')} className="premium-nav-button">
            <BarChart3 className="w-6 h-6" />
            {totalSold > 0 && (
              <span className="absolute top-1 right-2 bg-amber-500 text-white text-xs px-1.5 rounded-full font-bold animate-pulse-scale">
                {totalSold}
              </span>
            )}
            <span className="text-xs font-semibold">Продано</span>
          </button>

          <button onClick={() => router.push('/contact')} className="premium-nav-button">
            <Phone className="w-6 h-6" />
            <span className="text-xs font-semibold">Контакты</span>
          </button>

          {isAdminUser && (
            <button onClick={() => router.push('/admin')} className="premium-nav-button">
              <Settings className="w-6 h-6" />
              <span className="text-xs font-semibold">Админ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
