'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function ContactPage() {
  const router = useRouter();
  
  // Состояние для контактов из БД
  const [phoneNumber, setPhoneNumber] = useState('+7 980 679 0176');
  const [telegramUsername, setTelegramUsername] = useState('FixeR050');
  const [loading, setLoading] = useState(true);

  // Загрузка контактов из БД
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('phone, telegram')
        .eq('id', 1)
        .single();

      if (data) {
        // Используем данные из БД только если они есть, иначе дефолтные
        if (data.phone && data.phone.trim()) {
          setPhoneNumber(data.phone);
        }
        if (data.telegram && data.telegram.trim()) {
          // Убираем @ если есть
          const username = data.telegram.replace('@', '');
          setTelegramUsername(username);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      // При ошибке используем дефолтные значения
    } finally {
      setLoading(false);
    }
  };

  // Показываем skeleton пока грузятся данные
  if (loading) {
    return (
      <div className="min-h-screen pb-6 relative racing-stripes">
        <div className="sticky top-0 bg-tg-bg z-20 border-b border-tg-hint/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-tg-hint/10">
            <div className="w-11 h-11 rounded-full bg-tg-secondary-bg animate-pulse"></div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-tg-secondary-bg animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-tg-secondary-bg rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-tg-secondary-bg rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-11"></div>
          </div>
        </div>
        <div className="px-4 pt-4 space-y-3">
          <div className="h-20 bg-tg-secondary-bg rounded-xl animate-pulse"></div>
          <div className="h-20 bg-tg-secondary-bg rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 relative racing-stripes">
      {/* Шапка КАК В КАТАЛОГЕ */}
      <div className="sticky top-0 bg-tg-bg z-20 border-b border-tg-hint/10">
        {/* Логотип с кнопками по бокам */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-tg-hint/10">
          {/* Кнопка назад слева */}
          <button
            onClick={() => router.back()}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Логотип и название по центру */}
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            {/* Логотип */}
            <div className="relative w-16 h-16 flex-shrink-0 sm:w-20 sm:h-20">
              <Image
                src="/logo.png"
                alt="TOPGEARMOSCOW Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="text-left min-w-0">
              <h1 className="text-sm leading-tight truncate sm:text-base md:text-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, letterSpacing: '0.02em' }}>
                𝗧𝗢𝗣𝗚𝗘𝗔𝗥𝗠𝗢𝗦𝗖𝗢𝗪
              </h1>
              <p className="text-xs text-tg-hint truncate">Обратная связь</p>
            </div>
          </div>

          {/* Пустой div для баланса */}
          <div className="w-11"></div>
        </div>
      </div>

      {/* Content - БЕЗ ОБЛАЧКА, СРАЗУ КАРТОЧКИ */}
      <div className="px-4 pt-4 pb-8">
        <div className="max-w-xl mx-auto space-y-4">

          {/* Контактные кнопки */}
          <div className="space-y-3">
            
            {/* Telegram */}
            <a
              href={`https://t.me/${telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 tg-card transition-all hover:scale-[1.02] active:scale-[0.98] group border border-tg-hint/10 hover:border-blue-500/50"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:shadow-blue-500/50 transition-all group-hover:scale-110">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-tg-hint mb-1 uppercase tracking-wider">Написать в Telegram</div>
                <div className="text-xl font-bold">@{telegramUsername}</div>
              </div>
              <div className="text-tg-hint group-hover:text-blue-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Телефон - КАК В КАРТОЧКЕ, но с динамическим номером */}
            <button
              onClick={() => window.open(`tel:${phoneNumber.replace(/\s+/g, '')}`, '_blank')}
              className="flex items-center gap-4 p-5 tg-card transition-all hover:scale-[1.02] active:scale-[0.98] group border border-tg-hint/10 hover:border-green-500/50 w-full text-left"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:shadow-green-500/50 transition-all group-hover:scale-110">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-tg-hint mb-1 uppercase tracking-wider">Позвонить</div>
                <div className="text-xl font-bold">{phoneNumber}</div>
              </div>
              <div className="text-tg-hint group-hover:text-green-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

          </div>

          {/* Время работы */}
          <div className="tg-card p-6 space-y-4 border border-tg-hint/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tg-accent/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-tg-accent/20 to-tg-accent/10 rounded-xl">
                <Clock className="w-6 h-6 text-tg-accent" />
              </div>
              <h3 className="text-xl font-bold brand-name">Время работы</h3>
            </div>
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center p-3 rounded-lg bg-tg-secondary-bg/50 hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint font-medium">Пн - Пт</span>
                <span className="font-bold text-lg">09:00 - 21:00</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-tg-secondary-bg/50 hover:bg-tg-accent/5 transition-colors">
                <span className="text-tg-hint font-medium">Сб - Вс</span>
                <span className="font-bold text-lg">10:00 - 20:00</span>
              </div>
            </div>
          </div>

          {/* Информационный блок */}
          <div className="tg-card p-6 border border-tg-accent/20 bg-gradient-to-br from-tg-accent/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-tg-accent mt-2 animate-pulse"></div>
              <div>
                <p className="text-base leading-relaxed text-tg-hint">
                  Мы всегда готовы ответить на ваши вопросы и помочь с выбором автомобиля. 
                  Выберите удобный способ связи!
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Декоративный элемент внизу */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-tg-accent/50 to-transparent"></div>
    </div>
  );
}
