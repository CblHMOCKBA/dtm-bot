'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { Plus, CheckCircle, ArrowLeft, BarChart, Send, FileText, Trash, UserPlus, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/');
      return;
    }

    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/'));
    }

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  const handleClearCache = async () => {
    const confirmed = confirm(
      '⚠️ ВНИМАНИЕ!\n\n' +
      'Это действие очистит весь кэш приложения.\n\n' +
      'Будут удалены:\n' +
      '- Временные файлы\n' +
      '- Кэш браузера\n' +
      '- Session storage\n' +
      '- Local storage\n\n' +
      '⚠️ ДАННЫЕ В БАЗЕ НЕ ПОСТРАДАЮТ!\n\n' +
      'Продолжить?'
    );

    if (!confirmed) return;

    try {
      localStorage.clear();
      sessionStorage.clear();
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      alert('✅ Кэш успешно очищен!\n\nСтраница будет перезагружена.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('❌ Ошибка при очистке кэша');
      
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const handleAddAdmin = async () => {
    const telegramId = prompt(
      '➕ Добавить администратора\n\n' +
      'Введите Telegram ID нового администратора:\n\n' +
      '(Чтобы узнать ID, отправьте /start боту @userinfobot)'
    );

    if (!telegramId) return;

    if (!/^\d+$/.test(telegramId.trim())) {
      alert('❌ Ошибка!\n\nTelegram ID должен содержать только цифры.');
      return;
    }

    const confirmed = confirm(
      `✅ Подтверждение\n\n` +
      `Добавить администратора с ID:\n${telegramId}\n\n` +
      `Этот пользователь получит полный доступ к админ-панели!\n\n` +
      `Продолжить?`
    );

    if (!confirmed) return;

    try {
      const { data: existingAdmins } = await supabase
        .from('admins')
        .select('telegram_id')
        .eq('telegram_id', telegramId.trim())
        .single();

      if (existingAdmins) {
        alert('⚠️ Этот пользователь уже является администратором!');
        return;
      }

      const { error } = await supabase
        .from('admins')
        .insert([
          {
            telegram_id: telegramId.trim(),
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        if (error.code === '42P01') {
          alert(
            '⚠️ Таблица администраторов не существует!\n\n' +
            'Выполните SQL код из файла create_admins_table.sql в Supabase, затем попробуйте снова.'
          );
          return;
        }
        throw error;
      }

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      alert(
        `✅ Администратор добавлен!\n\n` +
        `Telegram ID: ${telegramId}\n\n` +
        `Теперь этот пользователь имеет доступ к админ-панели.`
      );
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('❌ Ошибка при добавлении администратора');
      
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg z-10 border-b border-tg-hint/10">
        {/* Кнопка назад */}
        <div className="px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Заголовок и кнопки */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Админ-панель</h1>
          </div>

          {/* Управление автомобилями - главная кнопка */}
          <button
            onClick={() => router.push('/admin/manage-cars')}
            className="w-full tg-button flex items-center justify-center gap-2 py-4"
          >
            <Car className="w-6 h-6" />
            <span className="font-bold">УПРАВЛЕНИЕ АВТОМОБИЛЯМИ</span>
          </button>
          
          {/* Быстрые действия */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/admin/add')}
              className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              ДОБАВИТЬ АВТО
            </button>
            <button
              onClick={() => router.push('/admin/add-sold')}
              className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              ДОБАВИТЬ ПРОДАННОЕ
            </button>
          </div>
          
          {/* Посты и Статистика */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => alert('📝 Функция "Посты" находится в разработке.\n\nСкоро будет доступна!')}
              className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              ПОСТЫ
            </button>
            <button
              onClick={() => router.push('/admin/stats')}
              className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2"
            >
              <BarChart className="w-5 h-5" />
              СТАТИСТИКА
            </button>
          </div>

          {/* Дополнительно */}
          <div>
            <h2 className="text-sm font-bold text-tg-hint uppercase tracking-wider mb-3 mt-2">
              Дополнительно
            </h2>

            {/* Три кнопки в один ряд */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => router.push('/admin/info')}
                className="w-full tg-button-secondary tg-button flex flex-col items-center justify-center gap-1 py-3"
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-semibold">ИНФО</span>
              </button>
              <button
                onClick={handleClearCache}
                className="w-full tg-button-secondary tg-button flex flex-col items-center justify-center gap-1 py-3"
              >
                <Trash className="w-5 h-5" />
                <span className="text-xs font-semibold">КЭШ</span>
              </button>
              <button
                onClick={handleAddAdmin}
                className="w-full tg-button-secondary tg-button flex flex-col items-center justify-center gap-1 py-3"
              >
                <UserPlus className="w-5 h-5" />
                <span className="text-xs font-semibold">АДМИН</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
