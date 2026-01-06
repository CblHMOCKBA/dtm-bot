'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { ArrowLeft, Save, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    manualSoldCount: 0,
    description: '',
    phone: '',
    telegram: '',
  });

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

    loadSettings();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  const loadSettings = async () => {
    try {
      // Загружаем настройки из таблицы settings (если есть)
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (data) {
        setSettings({
          manualSoldCount: data.manual_sold_count || 0,
          description: data.description || '',
          phone: data.phone || '',
          telegram: data.telegram || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          manual_sold_count: settings.manualSoldCount,
          description: settings.description,
          phone: settings.phone,
          telegram: settings.telegram,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      alert('Настройки сохранены!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-6 racing-stripes">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg z-20 border-b border-tg-hint/10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Кнопка назад */}
          <button
            onClick={() => router.push('/admin')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Заголовок */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">⚙️ Настройки</h1>
          </div>

          {/* Пустой div для баланса */}
          <div className="w-11"></div>
        </div>
      </div>

      {/* Контент */}
      <div className="px-4 space-y-4 mt-4">
        {/* Статистика */}
        <div className="bg-tg-secondary-bg rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tg-button" />
            <h2 className="font-bold text-lg">Статистика</h2>
          </div>
          
          <div>
            <label className="admin-label required">
              Дополнительные проданные авто
            </label>
            <input
              type="number"
              value={settings.manualSoldCount}
              onChange={(e) => setSettings({ ...settings, manualSoldCount: parseInt(e.target.value) || 0 })}
              className="admin-input"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-tg-hint mt-1">
              Количество авто, проданных до создания бота. Будет добавлено к счётчику на главной странице.
            </p>
          </div>
        </div>

        {/* Контакты */}
        <div className="bg-tg-secondary-bg rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-lg">📞 Контакты</h2>
          
          <div>
            <label className="admin-label">
              Телефон для связи
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="admin-input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label className="admin-label">
              Telegram username
            </label>
            <input
              type="text"
              value={settings.telegram}
              onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
              className="admin-input"
              placeholder="@topgearmoscow"
            />
          </div>
        </div>

        {/* Описание */}
        <div className="bg-tg-secondary-bg rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-lg">📝 Описание</h2>
          
          <div>
            <label className="admin-label">
              О компании
            </label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="admin-input"
              placeholder="Краткое описание компании..."
              rows={4}
            />
          </div>
        </div>

        {/* Кнопка сохранения */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full tg-button flex items-center justify-center gap-2 py-3 shadow-lg"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Сохранение...' : 'Сохранить настройки'}
        </button>

        {/* Инструкция */}
        <div className="bg-tg-button/10 rounded-xl p-4 text-sm text-tg-hint space-y-2">
          <p className="font-semibold text-tg-text">💡 Важно:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Изменения применятся сразу после сохранения</li>
            <li>Дополнительные проданные авто добавляются к счётчику из БД</li>
            <li>Контакты используются на странице "Обратная связь"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
