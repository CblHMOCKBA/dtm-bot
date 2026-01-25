'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { ArrowLeft, Save, Type, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MarqueePage() {
  const router = useRouter();
  const [marqueeText, setMarqueeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

    loadMarqueeText();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  const loadMarqueeText = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('marquee_text')
        .eq('id', 1)
        .single();

      if (data?.marquee_text) {
        setMarqueeText(data.marquee_text);
      } else {
        setMarqueeText('🔥 ГАРАНТИЯ КАЧЕСТВА • 💎 ПРЕМИУМ СЕРВИС • ⭐ ЛУЧШИЕ ЦЕНЫ');
      }
    } catch (error) {
      console.error('Error loading marquee text:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({ marquee_text: marqueeText })
        .eq('id', 1);

      if (error) throw error;

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      alert('✅ Бегущая строка сохранена!');
    } catch (error) {
      console.error('Error saving marquee text:', error);
      alert('❌ Ошибка при сохранении');
      
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMarqueeText('🔥 ГАРАНТИЯ КАЧЕСТВА • 💎 ПРЕМИУМ СЕРВИС • ⭐ ЛУЧШИЕ ЦЕНЫ');
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-lg z-10 border-b border-tg-accent/20">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-tg-secondary-bg to-tg-carbon flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-tg-accent/20 overflow-hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-bold">Бегущая строка</h1>

          <div className="w-11"></div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Иконка */}
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-tg-accent/20 flex items-center justify-center mb-3">
            <Type className="w-8 h-8 text-tg-accent" />
          </div>
          <p className="text-sm text-tg-hint">
            Текст будет отображаться на главной странице
          </p>
        </div>

        {/* Превью */}
        <div className="bg-tg-secondary-bg rounded-xl p-4 border border-tg-hint/10">
          <p className="text-xs text-tg-hint uppercase tracking-wider mb-2">Предпросмотр:</p>
          <div className="overflow-hidden py-2 bg-gradient-to-r from-transparent via-tg-accent/10 to-transparent rounded-lg">
            <div className="marquee-container">
              <div className="marquee-content">
                {[1, 2, 3].map((i) => (
                  <span key={i} className="mx-4 text-sm text-white/70 whitespace-nowrap">
                    {marqueeText || 'Введите текст...'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Поле ввода */}
        <div>
          <label className="block text-sm font-bold text-tg-hint mb-2 uppercase tracking-wider">
            Текст бегущей строки
          </label>
          <textarea
            value={marqueeText}
            onChange={(e) => setMarqueeText(e.target.value)}
            placeholder="Введите текст для бегущей строки..."
            className="w-full bg-tg-secondary-bg border border-tg-hint/20 rounded-xl px-4 py-3 text-white placeholder-tg-hint/50 focus:outline-none focus:border-tg-accent/50 transition-colors min-h-[100px] resize-none"
            disabled={loading}
          />
          <p className="text-xs text-tg-hint mt-2">
            💡 Используйте эмодзи и символ • для разделения
          </p>
        </div>

        {/* Кнопки */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            onClick={handleReset}
            className="tg-button-secondary flex items-center justify-center gap-2 py-3 rounded-xl active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Сбросить</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="tg-button flex items-center justify-center gap-2 py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
