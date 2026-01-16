'use client';

import { useEffect, useState, useRef } from 'react';
import { Car, Phone, Heart, BarChart3, Settings, Grid2X2, LayoutGrid, FileText, MessageCircle, ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign, Send, X, Search, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isAdmin, getTelegramWebApp } from '@/lib/telegram';
import { sendTelegramMessage, openTelegramChat } from '@/lib/messaging';
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<CarType[]>([]);
  const [stats, setStats] = useState({ total: 0, sold: 0, manualSold: 0, available: 0, premium: 0 });
  const [showSort, setShowSort] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double');
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const [telegramUsername, setTelegramUsername] = useState('dtm_moscow');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [showAllBrandsModal, setShowAllBrandsModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Форма заявки
  const [requestBrand, setRequestBrand] = useState('');
  const [requestBudget, setRequestBudget] = useState('');
  const [requestYear, setRequestYear] = useState('');
  const [requestComment, setRequestComment] = useState('');

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // Загружаем сохранённую тему
    const savedDarkMode = localStorage.getItem('dtm-dark-mode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }

    setIsAdminUser(isAdmin());

    Promise.all([
      loadCars(),
      loadStats(),
      loadSettings()
    ]);
  }, []);

  // Применяем тему
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-elegant-mode');
    } else {
      document.body.classList.remove('dark-elegant-mode');
    }
    localStorage.setItem('dtm-dark-mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [cars, statusFilter, searchQuery, sortOption, selectedBrand]);

  // Поиск для выпадающего списка
  useEffect(() => {
    if (searchQuery.trim() && searchFocused) {
      const query = searchQuery.toLowerCase().trim();
      const results = cars.filter(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        `${car.brand} ${car.model}`.toLowerCase().includes(query)
      ).slice(0, 6);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, cars, searchFocused]);

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
      const [availableResult, soldResult, settingsResult] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('settings').select('manual_sold_count').eq('id', 1).single()
      ]);

      setStats({
        total: availableResult.count || 0,
        available: availableResult.count || 0,
        sold: soldResult.count || 0,
        manualSold: settingsResult.data?.manual_sold_count || 0,
        premium: 0
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

    // Фильтр по марке
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(car => car.brand === selectedBrand);
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

  // ИСПРАВЛЕНО: Прямой вызов как в контактах
  const handleCall = () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
    window.open(`tel:${phoneNumber.replace(/\s+/g, '').replace(/[()]/g, '').replace(/-/g, '')}`, '_blank');
  };

  const handleTelegram = () => {
    openTelegramChat(telegramUsername);
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    setShowSort(false);
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleSearchResultClick = (carId: string) => {
    setSearchFocused(false);
    setSearchQuery('');
    navigateForward();
    router.push(`/car/${carId}`);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setSearchFocused(false);
    }, 200);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
  };

  // Подсчет марок и их количества
  const getBrandCounts = () => {
    const brandMap = new Map<string, number>();
    
    cars.forEach(car => {
      if (car.status !== 'sold') {
        const count = brandMap.get(car.brand) || 0;
        brandMap.set(car.brand, count + 1);
      }
    });

    // Сортируем по количеству (убывание)
    return Array.from(brandMap.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setShowAllBrandsModal(false);
    
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  // Получаем все марки с количеством
  const brandCounts = getBrandCounts();
  const topBrands = brandCounts.slice(0, 4); // ТОП-4 марки
  const remainingBrandsCount = brandCounts.length - 4;
  const totalCarsCount = cars.filter(car => car.status !== 'sold').length;

  const handleSubmitRequest = () => {
    if (!requestBrand.trim() && !requestBudget.trim() && !requestComment.trim()) {
      return;
    }
    
    let message = `🔥 ЗАЯВКА НА ПОДБОР АВТО\n\n`;
    
    if (requestBrand.trim()) {
      message += `🚗 Марка/Модель: ${requestBrand}\n`;
    }
    if (requestBudget.trim()) {
      message += `💰 Бюджет: ${requestBudget}\n`;
    }
    if (requestYear.trim()) {
      message += `📅 Год: от ${requestYear}\n`;
    }
    if (requestComment.trim()) {
      message += `📝 Пожелания: ${requestComment}\n`;
    }
    
    message += `\n⚡ Жду обратную связь!`;

    // ИСПРАВЛЕНО: Используем надёжную функцию
    sendTelegramMessage(telegramUsername, message);

    setShowRequestForm(false);
    setRequestBrand('');
    setRequestBudget('');
    setRequestYear('');
    setRequestComment('');
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'price_asc': return 'Цена ↑';
      case 'price_desc': return 'Цена ↓';
      case 'date_asc': return 'Старые';
      case 'date_desc': return 'Новые';
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн ₽`;
    }
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
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
      {/* Затемнение при фокусе поиска */}
      {searchFocused && (
        <div 
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setSearchFocused(false)}
        />
      )}

      {/* Hero секция */}
      <div className="relative pt-14 pb-1">
        <div className="flex items-center justify-between px-3 mb-1">
          {/* Левая часть: Telegram + Тема */}
          <div className="flex items-center gap-2 w-[100px]">
            {/* Telegram */}
            <button
              onClick={handleTelegram}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-[#29B6F6]/50 hover:bg-white/10 group"
              aria-label="Telegram"
            >
              <MessageCircle className="w-5 h-5 text-white group-hover:text-[#29B6F6] transition-colors" />
            </button>

            {/* Кнопка переключения темы */}
            <button
              onClick={toggleDarkMode}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-amber-500/50 hover:bg-white/10 group"
              aria-label="Переключить тему"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              )}
            </button>
          </div>

          {/* DTM по центру - абсолютное позиционирование */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
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

          {/* Правая часть - кнопка звонка */}
          <div className="w-[100px] flex justify-end">
            <button
              onClick={handleCall}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 hover:border-[#CC003A]/50 hover:bg-white/10 group"
              aria-label="Позвонить"
            >
              <Phone className="w-5 h-5 text-white group-hover:text-[#CC003A] transition-colors" />
            </button>
          </div>
        </div>

        {/* Smart Pills - Фильтр по популярным маркам */}
        <div className="relative overflow-hidden py-2 px-3 bg-gradient-to-r from-transparent via-tg-accent/5 to-transparent">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* Кнопка "Все" */}
            <button
              onClick={() => handleBrandSelect('all')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap
                transition-all duration-300 active:scale-95
                ${selectedBrand === 'all'
                  ? 'bg-gradient-to-r from-[#DC0000] to-[#CC003A] text-white border border-[#CC003A]/50 shadow-lg shadow-[#CC003A]/30'
                  : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              <span>Все</span>
              <span className={`text-[10px] ${selectedBrand === 'all' ? 'text-white/90' : 'text-white/50'}`}>
                {totalCarsCount}
              </span>
            </button>

            {/* ТОП-4 марки */}
            {topBrands.map(({ brand, count }) => (
              <button
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap
                  transition-all duration-300 active:scale-95
                  ${selectedBrand === brand
                    ? 'bg-gradient-to-r from-[#DC0000] to-[#CC003A] text-white border border-[#CC003A]/50 shadow-lg shadow-[#CC003A]/30'
                    : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <span>{brand}</span>
                <span className={`text-[10px] ${selectedBrand === brand ? 'text-white/90' : 'text-white/50'}`}>
                  {count}
                </span>
              </button>
            ))}

            {/* Кнопка "Ещё" если марок больше 4 */}
            {remainingBrandsCount > 0 && (
              <button
                onClick={() => {
                  setShowAllBrandsModal(true);
                  const tg = getTelegramWebApp();
                  if (tg?.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('light');
                  }
                }}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap
                  bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-tg-accent/30
                  transition-all duration-300 active:scale-95
                "
              >
                <span>Ещё</span>
                <span className="text-[10px] text-tg-accent">+{remainingBrandsCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Статистика - ИСПРАВЛЕНО: одинаковая структура для всех */}
        <div className="grid grid-cols-3 gap-2 px-3 mt-1 mb-2">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl py-3 px-2 text-center border border-white/10 hover:border-tg-accent/30 transition-all">
            <div className="text-xl font-bold text-tg-accent leading-none">{stats.available}</div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider font-medium mt-1.5">В наличии</div>
          </div>
          <button 
            onClick={() => { navigateForward(); router.push('/sold'); }}
            className="bg-white/5 backdrop-blur-sm rounded-xl py-3 px-2 text-center border border-white/10 transition-all duration-300 active:scale-95 hover:scale-[1.02] hover:border-tg-accent/40 hover:bg-white/10"
          >
            <div className="text-xl font-bold text-white leading-none">{totalSold}</div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider font-medium mt-1.5">Продано</div>
          </button>
          <button 
            onClick={() => setShowRequestForm(true)}
            className="bg-white/5 backdrop-blur-sm rounded-xl py-3 px-2 text-center border border-white/10 transition-all duration-300 active:scale-95 hover:scale-[1.02] hover:border-green-500/40 hover:bg-white/10"
          >
            <div className="text-xl font-bold text-green-400 leading-none flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-[8px] text-tg-hint uppercase tracking-wider font-medium mt-1.5">Заявка</div>
          </button>
        </div>
      </div>

      {/* Каталог */}
      <div className="pt-2 border-t border-tg-accent/10">
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

        {/* Поиск с выпадающим списком */}
        <div className="px-3 pb-2 flex gap-2 relative">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Марка, модель..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={handleSearchBlur}
              className={`w-full refined-search-input text-sm pr-10 transition-all duration-300 ${searchFocused ? 'relative z-50' : ''}`}
              style={searchFocused ? { 
                background: 'rgba(15, 14, 24, 0.98)',
                borderColor: 'rgba(204, 0, 58, 0.5)'
              } : {}}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tg-hint pointer-events-none" />
            
            {/* Выпадающий список результатов */}
            {searchFocused && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 animate-fade-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
                  border: '1px solid rgba(204, 0, 58, 0.3)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
                }}
              >
                {searchResults.map((car) => (
                  <button
                    key={car.id}
                    onClick={() => handleSearchResultClick(car.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-tg-secondary-bg">
                      {car.photos && car.photos[0] ? (
                        <img 
                          src={car.photos[0]} 
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-6 h-6 text-tg-hint" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium text-sm">
                        {car.brand} {car.model}
                      </div>
                      <div className="text-tg-hint text-xs">
                        {car.year} • {car.mileage.toLocaleString('ru-RU')} км
                      </div>
                      <div className="text-tg-accent font-bold text-sm mt-0.5">
                        {formatPrice(car.price)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchFocused && searchQuery.trim() && searchResults.length === 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 rounded-xl p-4 z-50 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
                  border: '1px solid rgba(204, 0, 58, 0.3)'
                }}
              >
                <Car className="w-8 h-8 mx-auto mb-2 text-tg-hint opacity-50" />
                <p className="text-tg-hint text-sm">Ничего не найдено</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            className="refined-icon-button group"
          >
            {viewMode === 'single' ? (
              <Grid2X2 className="w-5 h-5 text-tg-accent transition-all group-hover:rotate-90 group-hover:scale-110 duration-300" />
            ) : (
              <LayoutGrid className="w-5 h-5 text-tg-accent transition-all group-hover:rotate-90 group-hover:scale-110 duration-300" />
            )}
          </button>

          <button
            onClick={() => setShowSort(true)}
            className="refined-icon-button group relative"
          >
            <ArrowUpDown className="w-5 h-5 text-tg-accent transition-all group-hover:scale-110 duration-300" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-xs text-tg-hint">
            <span>Сортировка:</span>
            <span className="text-tg-accent font-medium">{getSortLabel()}</span>
          </div>
        </div>

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
                <X className="w-5 h-5" />
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

      {/* Модальное окно формы заявки */}
      {showRequestForm && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
          style={{
            background: 'rgba(4, 3, 14, 0.9)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowRequestForm(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-3xl p-5 animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
              backdropFilter: 'blur(20px)',
              borderTop: '2px solid rgba(34, 197, 94, 0.5)',
              boxShadow: '0 -10px 40px rgba(34, 197, 94, 0.2)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold brand-name text-green-400">ПОДБОР АВТО</h2>
              <button
                onClick={() => setShowRequestForm(false)}
                className="w-9 h-9 rounded-full bg-tg-secondary-bg flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-tg-hint mb-4">
              Заполните форму и мы подберём автомобиль под ваши требования
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-tg-hint mb-1.5 uppercase tracking-wider">
                  Марка / Модель
                </label>
                <input
                  type="text"
                  value={requestBrand}
                  onChange={(e) => setRequestBrand(e.target.value)}
                  placeholder="Например: BMW X5, Mercedes GLE"
                  className="w-full px-4 py-3 rounded-xl border border-tg-hint/30 text-white text-base placeholder:text-tg-hint/50 focus:border-green-500/50 focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    caretColor: '#22c55e'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-tg-hint mb-1.5 uppercase tracking-wider">
                  Бюджет
                </label>
                <input
                  type="text"
                  value={requestBudget}
                  onChange={(e) => setRequestBudget(e.target.value)}
                  placeholder="Например: до 5 млн, 3-7 млн"
                  className="w-full px-4 py-3 rounded-xl border border-tg-hint/30 text-white text-base placeholder:text-tg-hint/50 focus:border-green-500/50 focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    caretColor: '#22c55e'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-tg-hint mb-1.5 uppercase tracking-wider">
                  Год выпуска (от)
                </label>
                <input
                  type="text"
                  value={requestYear}
                  onChange={(e) => setRequestYear(e.target.value)}
                  placeholder="Например: 2020"
                  className="w-full px-4 py-3 rounded-xl border border-tg-hint/30 text-white text-base placeholder:text-tg-hint/50 focus:border-green-500/50 focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    caretColor: '#22c55e'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-tg-hint mb-1.5 uppercase tracking-wider">
                  Пожелания
                </label>
                <textarea
                  value={requestComment}
                  onChange={(e) => setRequestComment(e.target.value)}
                  placeholder="Цвет, комплектация, пробег и т.д."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-tg-hint/30 text-white text-base placeholder:text-tg-hint/50 focus:border-green-500/50 focus:outline-none transition-colors resize-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    caretColor: '#22c55e'
                  }}
                />
              </div>

              <button
                onClick={handleSubmitRequest}
                disabled={!requestBrand.trim() && !requestBudget.trim() && !requestComment.trim()}
                className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)'
                }}
              >
                <Send className="w-5 h-5" />
                <span>Отправить заявку</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно "Все марки" */}
      {showAllBrandsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
          style={{
            background: 'rgba(4, 3, 14, 0.9)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowAllBrandsModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-3xl p-5 animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.98), rgba(26, 25, 37, 0.95))',
              backdropFilter: 'blur(20px)',
              borderTop: '2px solid rgba(204, 0, 58, 0.5)',
              boxShadow: '0 -10px 40px rgba(204, 0, 58, 0.2)',
              maxHeight: '75vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold brand-name text-tg-accent flex items-center gap-2">
                🏷️ ВСЕ МАРКИ
              </h2>
              <button
                onClick={() => setShowAllBrandsModal(false)}
                className="w-9 h-9 rounded-full bg-tg-secondary-bg flex items-center justify-center active:scale-95 transition-transform hover:bg-tg-accent/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Кнопка "Все" */}
              <button
                onClick={() => handleBrandSelect('all')}
                className={`
                  w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98]
                  ${selectedBrand === 'all'
                    ? 'bg-gradient-to-r from-[#DC0000] to-[#CC003A] border-[#CC003A]/50 shadow-lg shadow-[#CC003A]/30'
                    : 'bg-tg-secondary-bg/50 border-tg-hint/10 hover:border-tg-accent/30 hover:bg-tg-secondary-bg'
                  }
                `}
              >
                <span className="font-bold text-white">Все марки</span>
                <span className={`text-sm font-semibold ${selectedBrand === 'all' ? 'text-white/90' : 'text-tg-hint'}`}>
                  {totalCarsCount}
                </span>
              </button>

              {/* Разделитель */}
              <div className="h-px bg-gradient-to-r from-transparent via-tg-hint/20 to-transparent my-3" />

              {/* Список всех марок по алфавиту */}
              {brandCounts
                .sort((a, b) => a.brand.localeCompare(b.brand))
                .map(({ brand, count }) => (
                  <button
                    key={brand}
                    onClick={() => handleBrandSelect(brand)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98]
                      ${selectedBrand === brand
                        ? 'bg-gradient-to-r from-[#DC0000] to-[#CC003A] border-[#CC003A]/50 shadow-lg shadow-[#CC003A]/30'
                        : 'bg-tg-secondary-bg/50 border-tg-hint/10 hover:border-tg-accent/30 hover:bg-tg-secondary-bg'
                      }
                    `}
                  >
                    <span className="font-bold text-white">{brand}</span>
                    <span className={`text-sm font-semibold ${selectedBrand === brand ? 'text-white/90' : 'text-tg-hint'}`}>
                      {count}
                    </span>
                  </button>
                ))}
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
