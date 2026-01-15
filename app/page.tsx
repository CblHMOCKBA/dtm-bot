'use client';

import { useEffect, useState } from 'react';
import { Car, Phone, Heart, BarChart3, Settings, Grid2X2, LayoutGrid, Award, MessageCircle, ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isAdmin, getTelegramWebApp } from '@/lib/telegram';
import { supabase } from '@/lib/supabase';
import { Car as CarType, CarStatus } from '@/types';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { useFavorites } from '@/lib/useFavorites';
import { useNavigation } from '@/components/NavigationProvider';

type SortOption = 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';

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
  const [showSort, setShowSort] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double');
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const [telegramUsername, setTelegramUsername] = useState('dtm_moscow');
  const [marqueeText, setMarqueeText] = useState('🔥 ГАРАНТИЯ КАЧЕСТВА • 💎 ПРЕМИУМ СЕРВИС • ⭐ ЛУЧШИЕ ЦЕНЫ');

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
    applyFiltersAndSort();
  }, [cars, statusFilter, searchQuery, sortOption]);

  const loadSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('phone, marquee_text, telegram')
        .eq('id', 1)
        .single();

      if (settings?.phone && settings.phone.trim()) {
        setPhoneNumber(settings.phone);
      }
      if (settings?.marquee_text && settings.marquee_text.trim()) {
        setMarqueeText(settings.marquee_text);
      }
      if (settings?.telegram && settings.telegram.trim()) {
        setTelegramUsername(settings.telegram.replace('@', ''));
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

  const applyFiltersAndSort = () => {
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

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'date_asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'date_desc':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    setFilteredCars(filtered);
  };

  const handleCall = () => {
    const phoneClean = phoneNumber.replace(/\s+/g, '').replace(/[()-]/g, '');
    window.open(`tel:${phoneClean}`, '_blank');
  };

  const handleTelegram = () => {
    const tg = getTelegramWebApp();
    if (tg) {
      try {
        tg.openTelegramLink(`https://t.me/${telegramUsername}`);
      } catch {
        window.location.href = `https://t.me/${telegramUsername}`;
      }
    } else {
      window.location.href = `https://t.me/${telegramUsername}`;
    }
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    setShowSort(false);
    const tg = getTelegramWebApp();
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'price_asc': return 'Цена ↑';
      case 'price_desc': return 'Цена ↓';
      case 'date_asc': return 'Старые';
      case 'date_desc': return 'Новые';
    }
  };

  const statusButtons: { value: 'all' | CarStatus; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'available', label: 'В наличии' },
    { value: 'order', label: 'Под заказ' },
    { value: 'inTransit', label: 'В пути' }
  ];

  const totalSold = stats.sold + stats.manualSold;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero секция - увеличен отступ сверху pt-14 для TG UI */}
      <div className="relative pt-14 pb-1">
        {/* Шапка с кнопками по углам */}
        <div className="flex items-center justify-between px-3 mb-1">
          <button
            onClick={handleTelegram}
            className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-[#29B6F6]/50 hover:bg-white/10 group"
            aria-label="Telegram"
          >
            <MessageCircle className="w-5 h-5 text-white group-hover:text-[#29B6F6] transition-colors" />
          </button>

          <div className="text-center">
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
              className="text-[8px] tracking-[0.2em] uppercase -mt-0.5"
              style={{ color: '#9CA3AF' }}
            >
              dtm.moscow
            </p>
          </div>

          <button
            onClick={handleCall}
            className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-[#CC003A]/50 hover:bg-white/10 group"
            aria-label="Позвонить"
          >
            <Phone className="w-5 h-5 text-white group-hover:text-[#CC003A] transition-colors" />
          </button>
        </div>

        {/* Бегущая строка */}
        <div className="relative overflow-hidden py-1 bg-gradient-to-r from-transparent via-tg-accent/5 to-transparent">
          <div className="marquee-container">
            <div className="marquee-content">
              {[1, 2, 3].map((i) => (
                <span key={i} className="mx-4 text-[10px] text-white/50 flex items-center gap-2 whitespace-nowrap">
                  <span>{marqueeText}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-2 px-3 mt-1 mb-2">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center border border-white/10 hover:border-tg-accent/30 transition-all">
            <div className="text-xl font-bold text-tg-accent">{stats.available}</div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider font-medium">В наличии</div>
          </div>
          <button 
            onClick={() => { navigateForward(); router.push('/sold'); }}
            className="bg-white/5 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center border border-white/10 transition-all duration-300 active:scale-95 hover:scale-[1.02] hover:border-tg-accent/40 hover:bg-white/10"
          >
            <div className="text-xl font-bold text-white">{totalSold}</div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider font-medium">Продано</div>
          </button>
          <button 
            onClick={() => { navigateForward(); router.push('/contact'); }}
            className="bg-white/5 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center border border-white/10 transition-all duration-300 active:scale-95 hover:scale-[1.02] hover:border-amber-500/40 hover:bg-white/10"
          >
            <div className="text-lg font-bold text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider font-medium">Премиум</div>
          </button>
        </div>
      </div>

      {/* Каталог секция */}
      <div className="pt-2 border-t border-tg-accent/10">
        {/* Вкладки статусов */}
        <div className="px-3 pb-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {statusButtons.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`refined-status-tab group ${statusFilter === status.value ? 'active' : ''}`}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="relative z-10 text-xs">{status.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Поиск + Кнопки */}
        <div className="px-3 pb-2 flex gap-2">
          <input
            type="text"
            placeholder="Марка, модель..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 refined-search-input text-sm"
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

          {/* Кнопка сортировки */}
          <button
            onClick={() => setShowSort(true)}
            className="refined-icon-button group relative"
            aria-label="Сортировка"
          >
            <ArrowUpDown className="w-5 h-5 text-tg-accent transition-all group-hover:scale-110 duration-300" />
          </button>
        </div>

        {/* Индикатор сортировки */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-xs text-tg-hint">
            <span>Сортировка:</span>
            <span className="text-tg-accent font-medium">{getSortLabel()}</span>
          </div>
        </div>

        {/* Список машин */}
        <div className="px-3 pt-1">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                {[1, 2, 3, 4].map((i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-8 fade-in">
                <Car className="w-14 h-14 mx-auto mb-3 text-tg-hint opacity-50 animate-pulse" />
                <p className="text-tg-hint text-base mb-2">Автомобили не найдены</p>
                <button onClick={() => { setStatusFilter('all'); setSearchQuery(''); }} className="tg-button mt-3 pulse-button">
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} gap-3 fade-in`}>
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

      {/* Модальное окно сортировки */}
      {showSort && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
          style={{
            background: 'rgba(4, 3, 14, 0.9)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowSort(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-3xl p-5 animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
              backdropFilter: 'blur(20px)',
              borderTop: '2px solid rgba(204, 0, 58, 0.5)',
              boxShadow: '0 -10px 40px rgba(204, 0, 58, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold brand-name text-tg-accent">СОРТИРОВКА</h2>
              <button
                onClick={() => setShowSort(false)}
                className="w-9 h-9 rounded-full bg-tg-secondary-bg flex items-center justify-center active:scale-95 transition-transform"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-tg-hint uppercase tracking-wider mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                По цене
              </div>
              
              <button
                onClick={() => handleSortSelect('price_asc')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                  sortOption === 'price_asc' 
                    ? 'bg-tg-accent/20 border-tg-accent/50 text-white' 
                    : 'bg-tg-secondary-bg/50 border-tg-hint/10 text-tg-hint hover:border-tg-accent/30'
                }`}
              >
                <span className="font-medium">Сначала дешёвые</span>
                <ArrowUp className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSortSelect('price_desc')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                  sortOption === 'price_desc' 
                    ? 'bg-tg-accent/20 border-tg-accent/50 text-white' 
                    : 'bg-tg-secondary-bg/50 border-tg-hint/10 text-tg-hint hover:border-tg-accent/30'
                }`}
              >
                <span className="font-medium">Сначала дорогие</span>
                <ArrowDown className="w-5 h-5" />
              </button>

              <div className="text-xs text-tg-hint uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                По дате
              </div>

              <button
                onClick={() => handleSortSelect('date_desc')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                  sortOption === 'date_desc' 
                    ? 'bg-tg-accent/20 border-tg-accent/50 text-white' 
                    : 'bg-tg-secondary-bg/50 border-tg-hint/10 text-tg-hint hover:border-tg-accent/30'
                }`}
              >
                <span className="font-medium">Сначала новые</span>
                <ArrowDown className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSortSelect('date_asc')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                  sortOption === 'date_asc' 
                    ? 'bg-tg-accent/20 border-tg-accent/50 text-white' 
                    : 'bg-tg-secondary-bg/50 border-tg-hint/10 text-tg-hint hover:border-tg-accent/30'
                }`}
              >
                <span className="font-medium">Сначала старые</span>
                <ArrowUp className="w-5 h-5" />
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
            <span className="text-[10px] font-semibold">Каталог</span>
          </button>

          <button onClick={() => { navigateForward(); router.push('/favorites'); }} className="refined-nav-button">
            <Heart className="w-6 h-6" />
            {favoritesCount > 0 && (
              <span className="absolute top-0 right-1 bg-tg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                {favoritesCount}
              </span>
            )}
            <span className="text-[10px] font-semibold">Избранное</span>
          </button>

          <button onClick={() => { navigateForward(); router.push('/sold'); }} className="refined-nav-button">
            <BarChart3 className="w-6 h-6" />
            {totalSold > 0 && (
              <span className="absolute top-0 right-1 bg-amber-500 text-white text-[10px] px-1 rounded-full font-bold animate-pulse">
                {totalSold}
              </span>
            )}
            <span className="text-[10px] font-semibold">Продано</span>
          </button>

          <button onClick={() => { navigateForward(); router.push('/contact'); }} className="refined-nav-button">
            <Phone className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Контакты</span>
          </button>

          {isAdminUser && (
            <button onClick={() => { navigateForward(); router.push('/admin'); }} className="refined-nav-button">
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Админ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
