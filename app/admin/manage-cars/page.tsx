'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { Plus, Edit, Trash2, CheckCircle, ArrowLeft, Search, Filter, Package } from 'lucide-react';
import Image from 'next/image';

type FilterStatus = 'all' | 'available' | 'order' | 'inTransit' | 'sold';

export default function ManageCarsPage() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/');
      return;
    }

    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/admin'));
    }

    loadCars();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  useEffect(() => {
    filterCars();
  }, [cars, searchQuery, filterStatus]);

  const loadCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = [...cars];

    // Фильтр по статусу
    if (filterStatus !== 'all') {
      filtered = filtered.filter(car => car.status === filterStatus);
    }

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(car =>
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.year.toString().includes(query)
      );
    }

    setFilteredCars(filtered);
  };

  const handleDelete = async (id: string, brand: string, model: string) => {
    if (!confirm(`Удалить ${brand} ${model}?`)) return;

    try {
      const { error } = await supabase.from('cars').delete().eq('id', id);

      if (error) throw error;

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      loadCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const handleMarkAsSold = async (id: string, brand: string, model: string) => {
    if (!confirm(`Пометить ${brand} ${model} как проданное?`)) return;

    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('id', id);

      if (error) throw error;

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      loadCars();
    } catch (error) {
      console.error('Error marking as sold:', error);
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'В наличии',
      order: 'Под заказ',
      inTransit: 'В пути',
      sold: 'Продано'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-500/20 text-green-500',
      order: 'bg-blue-500/20 text-blue-500',
      inTransit: 'bg-yellow-500/20 text-yellow-500',
      sold: 'bg-gray-500/20 text-gray-500'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg z-10 border-b border-tg-hint/10">
        <div className="px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <h1 className="text-2xl font-bold">Управление автомобилями</h1>

          {/* Кнопка добавить */}
          <button
            onClick={() => router.push('/admin/add')}
            className="w-full tg-button flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Добавить автомобиль
          </button>

          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tg-hint" />
            <input
              type="text"
              placeholder="Поиск по марке, модели, году..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/10 focus:border-tg-button focus:outline-none"
            />
          </div>

          {/* Фильтр по статусу */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filterStatus === 'all'
                  ? 'bg-tg-button text-white'
                  : 'bg-tg-secondary-bg text-tg-text'
              }`}
            >
              Все ({cars.length})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filterStatus === 'available'
                  ? 'bg-tg-button text-white'
                  : 'bg-tg-secondary-bg text-tg-text'
              }`}
            >
              В наличии ({cars.filter(c => c.status === 'available').length})
            </button>
            <button
              onClick={() => setFilterStatus('order')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filterStatus === 'order'
                  ? 'bg-tg-button text-white'
                  : 'bg-tg-secondary-bg text-tg-text'
              }`}
            >
              Под заказ ({cars.filter(c => c.status === 'order').length})
            </button>
            <button
              onClick={() => setFilterStatus('sold')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filterStatus === 'sold'
                  ? 'bg-tg-button text-white'
                  : 'bg-tg-secondary-bg text-tg-text'
              }`}
            >
              Продано ({cars.filter(c => c.status === 'sold').length})
            </button>
          </div>
        </div>
      </div>

      {/* Список автомобилей */}
      <div className="px-4 space-y-3 mt-4">
        {loading ? (
          <div className="text-center py-12 text-tg-hint">Загрузка...</div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-12 text-tg-hint">
            {searchQuery || filterStatus !== 'all' 
              ? 'Ничего не найдено' 
              : 'Автомобилей пока нет'}
          </div>
        ) : (
          filteredCars.map((car) => (
            <div key={car.id} className="tg-card overflow-hidden">
              <div className="flex gap-3">
                {/* Фото с правильным отображением */}
                <div className="w-28 h-28 flex-shrink-0 bg-tg-secondary-bg relative rounded-lg overflow-hidden">
                  {car.photos && car.photos.length > 0 ? (
                    <img
                      src={car.photos[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback если фото не загрузилось
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-tg-hint">Нет фото</div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-tg-hint">
                      Нет фото
                    </div>
                  )}
                  
                  {/* Бейдж статуса */}
                  <div className="absolute top-1 left-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(car.status)}`}>
                      {getStatusLabel(car.status)}
                    </span>
                  </div>
                </div>

                {/* Информация */}
                <div className="flex-1 min-w-0 py-2 pr-3">
                  <div className="font-bold text-lg truncate">
                    {car.brand} {car.model}
                  </div>
                  <div className="text-sm text-tg-button font-semibold">
                    {formatPrice(car.price)}
                  </div>
                  <div className="text-xs text-tg-hint mt-1">
                    {car.year} год • {car.mileage.toLocaleString()} км
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/admin/edit/${car.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Редактировать
                    </button>
                    
                    {car.status !== 'sold' && (
                      <button
                        onClick={() => handleMarkAsSold(car.id, car.brand, car.model)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Продано
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(car.id, car.brand, car.model)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
