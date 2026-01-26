'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { 
  ArrowLeft, Car, TrendingUp, TrendingDown, Users, Crown, 
  DollarSign, Calendar, ArrowRightLeft, RefreshCw, 
  BarChart3, PieChart, Target, Percent, Clock
} from 'lucide-react';

interface Stats {
  totalCars: number;
  availableCars: number;
  soldCars: number;
  avgPrice: number;
  totalValue: number;
  tradeInActive: number;
  tradeInArchived: number;
  carsThisMonth: number;
  soldThisMonth: number;
  topBrands: { brand: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  monthlyStats: { month: string; added: number; sold: number }[];
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalCars: 0,
    availableCars: 0,
    soldCars: 0,
    avgPrice: 0,
    totalValue: 0,
    tradeInActive: 0,
    tradeInArchived: 0,
    carsThisMonth: 0,
    soldThisMonth: 0,
    topBrands: [],
    priceRanges: [],
    monthlyStats: [],
  });
  const [loading, setLoading] = useState(true);

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

    loadStats();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Загружаем все авто для расчётов
      const { data: allCars } = await supabase
        .from('cars')
        .select('id, brand, price, status, created_at');

      const cars = allCars || [];
      
      // Базовые подсчёты
      const totalCars = cars.length;
      const availableCars = cars.filter(c => c.status !== 'sold').length;
      const soldCars = cars.filter(c => c.status === 'sold').length;
      
      // Средняя цена и общая стоимость (только доступные)
      const availableCarsList = cars.filter(c => c.status !== 'sold');
      const avgPrice = availableCarsList.length > 0 
        ? Math.round(availableCarsList.reduce((sum, c) => sum + (c.price || 0), 0) / availableCarsList.length)
        : 0;
      const totalValue = availableCarsList.reduce((sum, c) => sum + (c.price || 0), 0);

      // Статистика за текущий месяц
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const carsThisMonth = cars.filter(c => c.created_at >= startOfMonth).length;
      const soldThisMonth = cars.filter(c => c.status === 'sold' && c.created_at >= startOfMonth).length;

      // Топ брендов
      const brandCounts: Record<string, number> = {};
      availableCarsList.forEach(c => {
        brandCounts[c.brand] = (brandCounts[c.brand] || 0) + 1;
      });
      const topBrands = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Распределение по ценам
      const priceRanges = [
        { range: 'до 3 млн', count: availableCarsList.filter(c => c.price < 3000000).length },
        { range: '3-5 млн', count: availableCarsList.filter(c => c.price >= 3000000 && c.price < 5000000).length },
        { range: '5-10 млн', count: availableCarsList.filter(c => c.price >= 5000000 && c.price < 10000000).length },
        { range: '10-20 млн', count: availableCarsList.filter(c => c.price >= 10000000 && c.price < 20000000).length },
        { range: '20+ млн', count: availableCarsList.filter(c => c.price >= 20000000).length },
      ].filter(r => r.count > 0);

      // Статистика по месяцам (последние 6 месяцев)
      const monthlyStats: { month: string; added: number; sold: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = date.toISOString();
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
        const monthName = date.toLocaleDateString('ru-RU', { month: 'short' });
        
        const added = cars.filter(c => c.created_at >= monthStart && c.created_at <= monthEnd).length;
        const sold = cars.filter(c => c.status === 'sold' && c.created_at >= monthStart && c.created_at <= monthEnd).length;
        
        monthlyStats.push({ month: monthName, added, sold });
      }

      // Trade-In заявки
      let tradeInActive = 0;
      let tradeInArchived = 0;
      try {
        const { count: active } = await supabase
          .from('trade_in_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        tradeInActive = active || 0;

        const { count: archived } = await supabase
          .from('trade_in_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'archived');
        tradeInArchived = archived || 0;
      } catch (e) {
        // Таблица может не существовать
      }

      setStats({
        totalCars,
        availableCars,
        soldCars,
        avgPrice,
        totalValue,
        tradeInActive,
        tradeInArchived,
        carsThisMonth,
        soldThisMonth,
        topBrands,
        priceRanges,
        monthlyStats,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} млрд`;
    }
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн`;
    }
    return price.toLocaleString('ru-RU');
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    suffix = '',
    color = 'white',
    trend,
    small = false,
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    suffix?: string;
    color?: string;
    trend?: 'up' | 'down';
    small?: boolean;
  }) => (
    <div className={`rounded-2xl p-4 border border-white/10 transition-all hover:border-white/20 ${small ? '' : ''}`}
      style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      
      <div className={`font-bold text-white ${small ? 'text-xl' : 'text-2xl'}`}>
        {loading ? (
          <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
        ) : (
          <>{value}{suffix}</>
        )}
      </div>
      
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  );

  // Простая визуализация бара
  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percent = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Шапка */}
      <div className="sticky top-0 z-30 border-b border-white/10"
        style={{ background: 'linear-gradient(180deg, rgba(4, 3, 14, 0.98) 0%, rgba(4, 3, 14, 0.95) 100%)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#CC003A]" />
            <h1 className="text-lg font-bold text-white">Статистика</h1>
          </div>
          
          <button
            onClick={loadStats}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        
        {/* Главные метрики */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Car}
            label="Всего в каталоге"
            value={stats.totalCars}
            color="#CC003A"
          />
          <StatCard
            icon={TrendingUp}
            label="В наличии"
            value={stats.availableCars}
            color="#22C55E"
            trend="up"
          />
          <StatCard
            icon={Crown}
            label="Продано всего"
            value={stats.soldCars}
            color="#F59E0B"
          />
          <StatCard
            icon={Target}
            label="Продано в этом месяце"
            value={stats.soldThisMonth}
            color="#8B5CF6"
            trend={stats.soldThisMonth > 0 ? 'up' : undefined}
          />
        </div>

        {/* Финансы */}
        <div>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Финансы
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={DollarSign}
              label="Средняя цена авто"
              value={formatPrice(stats.avgPrice)}
              suffix=" ₽"
              color="#10B981"
              small
            />
            <StatCard
              icon={PieChart}
              label="Общая стоимость"
              value={formatPrice(stats.totalValue)}
              suffix=" ₽"
              color="#3B82F6"
              small
            />
          </div>
        </div>

        {/* Trade-In */}
        {(stats.tradeInActive > 0 || stats.tradeInArchived > 0) && (
          <div>
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Trade-In заявки
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Clock}
                label="Активные заявки"
                value={stats.tradeInActive}
                color="#F59E0B"
                trend={stats.tradeInActive > 0 ? 'up' : undefined}
                small
              />
              <StatCard
                icon={Percent}
                label="Отработано"
                value={stats.tradeInArchived}
                color="#22C55E"
                small
              />
            </div>
          </div>
        )}

        {/* Топ брендов */}
        {stats.topBrands.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Топ брендов в наличии
            </h2>
            <div className="rounded-2xl p-4 border border-white/10 space-y-3"
              style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))' }}
            >
              {stats.topBrands.map((item, i) => (
                <div key={item.brand} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#CC003A] to-[#990029] flex items-center justify-center text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-white">{item.brand}</span>
                  <span className="text-white/50 font-bold">{item.count}</span>
                  <div className="w-20">
                    <ProgressBar 
                      value={item.count} 
                      max={stats.topBrands[0]?.count || 1} 
                      color="#CC003A" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Распределение по ценам */}
        {stats.priceRanges.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Распределение по ценам
            </h2>
            <div className="rounded-2xl p-4 border border-white/10 space-y-3"
              style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))' }}
            >
              {stats.priceRanges.map((item) => (
                <div key={item.range} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-white/70">{item.range}</span>
                  <div className="flex-1">
                    <ProgressBar 
                      value={item.count} 
                      max={Math.max(...stats.priceRanges.map(r => r.count))} 
                      color="#3B82F6" 
                    />
                  </div>
                  <span className="w-8 text-right text-white font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* График по месяцам */}
        {stats.monthlyStats.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Динамика за 6 месяцев
            </h2>
            <div className="rounded-2xl p-4 border border-white/10"
              style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))' }}
            >
              {/* Легенда */}
              <div className="flex gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#CC003A]" />
                  <span className="text-white/50">Добавлено</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <span className="text-white/50">Продано</span>
                </div>
              </div>
              
              {/* Бары */}
              <div className="flex items-end justify-between gap-2 h-32">
                {stats.monthlyStats.map((item) => {
                  const maxVal = Math.max(...stats.monthlyStats.flatMap(m => [m.added, m.sold]), 1);
                  const addedHeight = (item.added / maxVal) * 100;
                  const soldHeight = (item.sold / maxVal) * 100;
                  
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1 items-end h-24">
                        <div 
                          className="flex-1 bg-[#CC003A] rounded-t transition-all duration-500"
                          style={{ height: `${addedHeight}%`, minHeight: item.added > 0 ? '4px' : '0' }}
                        />
                        <div 
                          className="flex-1 bg-[#22C55E] rounded-t transition-all duration-500"
                          style={{ height: `${soldHeight}%`, minHeight: item.sold > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <span className="text-[10px] text-white/50 uppercase">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Подсказка */}
        <div className="p-4 rounded-2xl border border-white/10 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(204, 0, 58, 0.1), rgba(153, 0, 41, 0.05))' }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#CC003A]/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-[#CC003A]" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">Совет</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Регулярно обновляйте каталог и отмечайте проданные авто для точной статистики. 
              Архивные Trade-In заявки автоматически удаляются через 30 дней.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
