'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { ArrowLeft, Car, TrendingUp, Users, Send, Eye, Crown } from 'lucide-react';

interface Stats {
  totalCars: number;
  availableCars: number;
  soldCars: number;
  totalUsers: number;
  totalPosts: number;
  viewsToday: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalCars: 0,
    availableCars: 0,
    soldCars: 0,
    totalUsers: 0,
    totalPosts: 0,
    viewsToday: 0,
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
      // Общее количество автомобилей
      const { count: totalCars } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });

      // Автомобили в наличии
      const { count: availableCars } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'sold');

      // Проданные автомобили
      const { count: soldCars } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sold');

      // Пользователи в боте
      const { count: totalUsers } = await supabase
        .from('bot_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Отправлено постов
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalCars: totalCars || 0,
        availableCars: availableCars || 0,
        soldCars: soldCars || 0,
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        viewsToday: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color = 'tg-button',
    gradient = false 
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    color?: string;
    gradient?: boolean;
  }) => (
    <div className="tg-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      {/* Gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-tg-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
          {gradient && <Crown className="w-5 h-5 text-amber-500" />}
        </div>
        
        <div className={`text-3xl font-bold mb-1 pl-1 ${gradient ? 'text-gradient' : ''}`}>
          {loading ? (
            <div className="skeleton-text h-8 w-20 rounded"></div>
          ) : (
            value.toLocaleString('ru-RU')
          )}
        </div>
        
        <div className="text-sm text-tg-hint leading-tight break-words">{label}</div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-md z-10 border-b border-tg-hint/10">
        {/* Кнопка назад */}
        <div className="px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Заголовок */}
        <div className="px-4 pb-4">
          <h1 className="text-2xl font-bold text-gradient">Статистика</h1>
          <p className="text-sm text-tg-hint mt-1">Аналитика вашего автосалона</p>
        </div>
      </div>

      {/* Статистика */}
      <div className="px-4 space-y-4 mt-4">
        {/* Автомобили */}
        <div>
          <h2 className="text-sm font-bold text-tg-hint uppercase tracking-wider mb-3">
            Автомобили
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Car}
              label="Всего автомобилей"
              value={stats.totalCars}
              color="tg-button"
              gradient
            />
            <StatCard
              icon={TrendingUp}
              label="В наличии"
              value={stats.availableCars}
              color="green-500"
            />
          </div>
        </div>

        {/* Продажи авто */}
        <div className="grid grid-cols-1 gap-3">
          <StatCard
            icon={Crown}
            label="Продано автомобилей"
            value={stats.soldCars}
            color="amber-500"
            gradient
          />
        </div>

        {/* Пользователи и контент */}
        <div>
          <h2 className="text-sm font-bold text-tg-hint uppercase tracking-wider mb-3 mt-6">
            Взаимодействие
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Users}
              label="Пользователей в боте"
              value={stats.totalUsers}
              color="blue-500"
            />
            <StatCard
              icon={Send}
              label="Отправлено постов"
              value={stats.totalPosts}
              color="tg-accent"
            />
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 p-4 bg-tg-secondary-bg/50 rounded-xl border border-tg-hint/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-tg-button/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-tg-button" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Подсказка</h3>
              <p className="text-sm text-tg-hint leading-relaxed">
                Статистика обновляется в реальном времени. Для детальной аналитики используйте раздел "Управление автомобилями".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
