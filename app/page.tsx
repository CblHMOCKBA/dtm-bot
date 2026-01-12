'use client';

import { useEffect, useState, useRef } from 'react';
import { Car, Phone, SlidersHorizontal, Heart, BarChart3, Settings, Grid2X2, LayoutGrid, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isAdmin, getTelegramWebApp } from '@/lib/telegram';
import { supabase } from '@/lib/supabase';
import { Car as CarType, CarStatus } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { useFavorites } from '@/lib/useFavorites';
import { useNavigation } from '@/components/NavigationProvider';

export default function Home() {
  const router = useRouter();
  const { navigateForward } = useNavigation();
  const { count: favoritesCount } = useFavorites();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [cars, setCars] = useState<CarType[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | CarStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, sold: 0, manualSold: 0, available: 0, premium: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const [marqueeText, setMarqueeText] = useState('🔥 ГАРАНТИЯ КАЧЕСТВА • 💎 ПРЕМИУМ СЕРВИС • ⭐ ЛУЧШИЕ ЦЕНЫ');
  
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
      loadStats(),
      loadSettings()
    ]);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cars, statusFilter, searchQuery, filterBrand, filterYearFrom, filterYearTo, filterPriceFrom, filterPriceTo]);

  const loadSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('phone, marquee_text')
        .eq('id', 1)
        .single();

      if (settings?.phone && settings.phone.trim()) {
        setPhoneNumber(settings.phone);
      }
      if (settings?.marquee_text && settings.marquee_text.trim()) {
        setMarqueeText(settings.marquee_text);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

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
      const [availableResult, soldResult, settingsResult, allCarsResult] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('settings').select('manual_sold_count').eq('id', 1).single(),
        supabase.from('cars').select('brand').neq('status', 'sold')
      ]);

      // Считаем премиум бренды
      const premiumBrands = ['Mercedes-Benz', 'BMW', 'Porsche', 'Audi', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'Maserati', 'Maybach'];
      const premiumCount = allCarsResult.data?.filter(car => premiumBrands.includes(car.brand)).length || 0;

      setStats({
        total: availableResult.count || 0,
        available: availableResult.count || 0,
        sold: soldResult.count || 0,
        manualSold: settingsResult.data?.manual_sold_count || 0,
        premium: premiumCount
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

  const handleCall = () => {
    window.open(`tel:${phoneNumber.replace(/\s+/g, '')}`, '_blank');
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
    <div className="min-h-screen pb-20">
      {/* Hero секция */}
      <div className="relative pt-2 pb-2">
        {/* Верхняя строка с кнопками */}
        <div className="flex items-center justify-between px-4 mb-2">
          {/* Telegram кнопка слева */}
          <button
            onClick={() => window.open('https://t.me/dtm_moscow', '_blank')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-[#29B6F6]/50 hover:bg-white/10 group overflow-hidden"
            aria-label="Telegram"
          >
            <svg className="w-[18px] h-[18px] text-white group-hover:text-[#29B6F6] transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </button>

          {/* Логотип по центру */}
          <div className="text-center flex-1">
            <h1 
              className="text-2xl font-black tracking-[0.15em]"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                color: 'white',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
              }}
            >
              DTM
            </h1>
            <p 
              className="text-[9px] tracking-[0.2em] uppercase -mt-0.5"
              style={{ color: '#9CA3AF' }}
            >
              dtm.moscow
            </p>
          </div>

          {/* Телефон справа */}
          <button
            onClick={handleCall}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-tg-accent/50 hover:bg-white/10 group overflow-hidden"
            aria-label="Позвонить"
          >
            <Phone className="w-[18px] h-[18px] text-white group-hover:text-tg-accent transition-colors" />
          </button>
        </div>

        {/* Подзаголовок */}
        <div className="text-center mb-1">
          <p className="text-xs tracking-[0.15em] uppercase text-white/60">
            Премиум автомобили
          </p>
        </div>

        {/* Бегущая строка */}
        <div className="relative overflow-hidden py-1.5 bg-gradient-to-r from-transparent via-tg-accent/5 to-transparent">
          <div className="marquee-container">
            <div className="marquee-content">
              {[1, 2, 3].map((i) => (
                <span key={i} className="mx-4 text-xs text-white/50 flex items-center gap-2 whitespace-nowrap">
                  <span>{marqueeText}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Статистика - компактные карточки */}
        <div className="grid grid-cols-3 gap-2 px-4 mt-2 mb-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg py-2 px-1 text-center border border-white/10">
            <div className="text-lg font-bold text-tg-accent">{stats.available}</div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider">В наличии</div>
          </div>
          <button 
            onClick={() => { navigateForward(); router.push('/sold'); }}
            className="bg-white/5 backdrop-blur-sm rounded-lg py-2 px-1 text-center border border-white/10 transition-all duration-300 active:scale-95 hover:scale-[1.03] hover:border-tg-accent/40 hover:bg-white/10"
          >
            <div className="text-lg font-bold text-white">{totalSold}</div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider">Продано</div>
          </button>
          <button 
            onClick={() => { navigateForward(); router.push('/contact'); }}
            className="bg-white/5 backdrop-blur-sm rounded-lg py-2 px-1 text-center border border-white/10 transition-all duration-300 active:scale-95 hover:scale-[1.03] hover:border-amber-500/40 hover:bg-white/10"
          >
            <div className="text-base font-bold text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider">Премиум</div>
          </button>
        </div>
      </div>

      {/* Каталог секция - прозрачный фон чтобы виден задник */}
      <div className="pt-3 border-t border-tg-accent/10">
        {/* Вкладки статусов */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {statusButtons.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`refined-status-tab group ${statusFilter === status.value ? 'active' : ''}`}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="relative z-10">{status.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Поиск + Кнопки */}
        <div className="px-4 pb-3 flex gap-2">
          <input
            type="text"
            placeholder="Марка, модель, год..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 refined-search-input"
          />
          
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            className="refined-icon-button group"
            aria-label="Переключить вид"
          >
            {viewMode === 'single' ? (
              <Grid2X2 className="w-5 h-5 text-tg-accent transition-all group-hover:rotate-90 group-hover:scale-110 duration-300" />
            ) : (
              <LayoutGrid className="w-5 h-5 text-tg-accent transition-all group-hover:rotate-90 group-hover:scale-110 duration-300" />
            )}
          </button>

          <button
            onClick={() => setShowFilters(true)}
            className="refined-icon-button group"
            aria-label="Фильтры"
          >
            <SlidersHorizontal className="w-5 h-5 text-tg-accent transition-all group-hover:rotate-90 group-hover:scale-110 duration-300" />
          </button>
        </div>

        {/* Активные фильтры */}
        {(filterBrand || filterYearFrom || filterYearTo || filterPriceFrom || filterPriceTo) && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {filterBrand && (
                <div className="refined-active-badge group">
                  <span>{filterBrand}</span>
                  <button onClick={() => setFilterBrand('')} className="hover:scale-125 transition-transform">×</button>
                </div>
              )}
              {(filterYearFrom || filterYearTo) && (
                <div className="refined-active-badge group">
                  <span>{filterYearFrom || '...'} - {filterYearTo || '...'}</span>
                  <button onClick={() => { setFilterYearFrom(''); setFilterYearTo(''); }} className="hover:scale-125 transition-transform">×</button>
                </div>
              )}
              {(filterPriceFrom || filterPriceTo) && (
                <div className="refined-active-badge group">
                  <span>
                    {filterPriceFrom ? `${(parseInt(filterPriceFrom) / 1000000).toFixed(1)}М` : '...'} - {filterPriceTo ? `${(parseInt(filterPriceTo) / 1000000).toFixed(1)}М` : '...'}
                  </span>
                  <button onClick={() => { setFilterPriceFrom(''); setFilterPriceTo(''); }} className="hover:scale-125 transition-transform">×</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Список машин */}
        <div className="px-4 pt-2">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                {[1, 2, 3, 4].map((i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-12 fade-in">
                <Car className="w-16 h-16 mx-auto mb-4 text-tg-hint opacity-50 animate-pulse" />
                <p className="text-tg-hint text-lg mb-2">Автомобили не найдены</p>
                <button onClick={resetFilters} className="tg-button mt-4 pulse-button">
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 fade-in`}>
                {filteredCars.map((car) => (
                  <CarCard 
                    key={car.id} 
                    car={car} 
                    onClick={() => {
                      navigateForward();
                      router.push(`/car/${car.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
                className="w-10 h-10 rounded-full bg-tg-secondary-bg flex items-center justify-center active:scale-95 transition-transform"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Марка</label>
              <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="refined-select">
                <option value="">Все марки</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Год от</label>
                <input type="number" placeholder="2010" value={filterYearFrom} onChange={(e) => setFilterYearFrom(e.target.value)} className="refined-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Год до</label>
                <input type="number" placeholder="2024" value={filterYearTo} onChange={(e) => setFilterYearTo(e.target.value)} className="refined-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Цена от</label>
                <input type="number" placeholder="1000000" value={filterPriceFrom} onChange={(e) => setFilterPriceFrom(e.target.value)} className="refined-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">Цена до</label>
                <input type="number" placeholder="10000000" value={filterPriceTo} onChange={(e) => setFilterPriceTo(e.target.value)} className="refined-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={resetFilters} className="tg-button-secondary flex-1 active:scale-95 transition-transform">
                Сбросить
              </button>
              <button onClick={() => setShowFilters(false)} className="tg-button flex-1 pulse-button active:scale-95 transition-transform">
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10"
        style={{
          background: 'rgba(10, 10, 20, 0.4)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-3xl mx-auto">
          <button className="refined-nav-button active">
            <Car className="w-6 h-6" />
            <span className="text-xs font-semibold">Каталог</span>
          </button>

          <button onClick={() => { navigateForward(); router.push('/favorites'); }} className="refined-nav-button">
            <Heart className="w-6 h-6" />
            {favoritesCount > 0 && (
              <span className="absolute top-1 right-2 bg-tg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                {favoritesCount}
              </span>
            )}
            <span className="text-xs font-semibold">Избранное</span>
          </button>

          <button onClick={() => { navigateForward(); router.push('/sold'); }} className="refined-nav-button">
            <BarChart3 className="w-6 h-6" />
            {totalSold > 0 && (
              <span className="absolute top-1 right-2 bg-amber-500 text-white text-xs px-1.5 rounded-full font-bold animate-pulse">
                {totalSold}
              </span>
            )}
            <span className="text-xs font-semibold">Продано</span>
          </button>

          <button onClick={() => { navigateForward(); router.push('/contact'); }} className="refined-nav-button">
            <Phone className="w-6 h-6" />
            <span className="text-xs font-semibold">Контакты</span>
          </button>

          {isAdminUser && (
            <button onClick={() => { navigateForward(); router.push('/admin'); }} className="refined-nav-button">
              <Settings className="w-6 h-6" />
              <span className="text-xs font-semibold">Админ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
