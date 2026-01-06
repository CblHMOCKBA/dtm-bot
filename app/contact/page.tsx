'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const router = useRouter();
  
  // DTM контакты - ИСПРАВЛЕНО
  const [phoneNumber, setPhoneNumber] = useState('+7(999)999-36-96');
  const [telegramUsername, setTelegramUsername] = useState('dtm_moscow');
  const [loading, setLoading] = useState(true);

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
        if (data.phone && data.phone.trim()) {
          setPhoneNumber(data.phone);
        }
        if (data.telegram && data.telegram.trim()) {
          const username = data.telegram.replace('@', '');
          setTelegramUsername(username);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-6 relative racing-stripes">
        <div className="sticky top-0 bg-tg-bg z-20 border-b border-tg-hint/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-tg-hint/10">
            <div className="w-11 h-11 bg-tg-secondary-bg animate-pulse rounded-xl"></div>
            <div className="flex items-center gap-3">
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
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg z-20 border-b border-tg-hint/10" style={{
        background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.95), rgba(26, 25, 37, 0.85))',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-tg-hint/10">
          <button
            onClick={() => router.back()}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* DTM логотип */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold brand-name text-tg-accent tracking-[0.3em]">
                DTM
              </h1>
              <p className="text-xs text-tg-hint uppercase tracking-wider">Обратная связь</p>
            </div>
          </div>

          <div className="w-11"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-8">
        <div className="max-w-xl mx-auto space-y-4">

          {/* Telegram */}
          <a
            href={`https://t.me/${telegramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 tg-card transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg group-hover:shadow-blue-500/50 transition-all group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #0088cc, #0066aa)',
                boxShadow: '0 4px 20px rgba(0, 136, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
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

          {/* Телефон */}
          <button
            onClick={() => window.open(`tel:${phoneNumber.replace(/\s+/g, '').replace(/[()]/g, '').replace(/-/g, '')}`, '_blank')}
            className="flex items-center gap-4 p-5 tg-card transition-all hover:scale-[1.02] active:scale-[0.98] group w-full text-left"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg group-hover:shadow-green-500/50 transition-all group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
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

          {/* Время работы */}
          <div className="tg-card p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tg-accent/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(204, 0, 58, 0.2), rgba(204, 0, 58, 0.1))'
                }}
              >
                <Clock className="w-6 h-6 text-tg-accent" />
              </div>
              <h3 className="text-xl font-bold brand-name uppercase tracking-wider">Время работы</h3>
            </div>
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center p-3 rounded-lg transition-colors"
                style={{
                  background: 'rgba(15, 14, 24, 0.5)'
                }}
              >
                <span className="text-tg-hint font-medium uppercase text-sm">Пн - Пт</span>
                <span className="font-bold text-lg">09:00 - 21:00</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg transition-colors"
                style={{
                  background: 'rgba(15, 14, 24, 0.5)'
                }}
              >
                <span className="text-tg-hint font-medium uppercase text-sm">Сб - Вс</span>
                <span className="font-bold text-lg">10:00 - 20:00</span>
              </div>
            </div>
          </div>

          {/* Информационный блок */}
          <div className="tg-card p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(204, 0, 58, 0.1), rgba(204, 0, 58, 0.05))',
              borderColor: 'rgba(204, 0, 58, 0.3)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-tg-accent mt-2"></div>
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
      <div className="h-1 w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(204, 0, 58, 0.5), transparent)'
        }}
      ></div>
    </div>
  );
}
