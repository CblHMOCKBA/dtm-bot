'use client';

import { useEffect, useState } from 'react';
import { Phone, MessageCircle, Clock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNavigation from '@/components/BottomNavigation';
import Logo from '@/components/Logo';

export default function ContactPage() {
  const router = useRouter();
  
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
      <div className="min-h-screen pb-20 relative">
        <div className="sticky top-0 z-20 border-b border-tg-hint/10"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center justify-center px-4 py-3">
            <div className="w-20 h-6 bg-black/30 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="px-4 pt-4 space-y-3">
          <div className="h-20 bg-black/30 rounded-xl animate-pulse"></div>
          <div className="h-20 bg-black/30 rounded-xl animate-pulse"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Шапка - только DTM */}
      <div className="sticky top-0 z-20 border-b border-tg-hint/10" style={{
        background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.5), rgba(26, 25, 37, 0.4))',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex items-center justify-center px-4 py-1">
          {/* DTM логотип по центру */}
          <div className="text-center">
            <Logo height={104} className="mx-auto mb-1" />
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#9CA3AF' }}>Обратная связь</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-6">
        <div className="max-w-xl mx-auto space-y-3">

          {/* Telegram */}
          <a
            href={`https://t.me/${telegramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 tg-card transition-all hover:scale-[1.01] active:scale-[0.98] group"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg group-hover:shadow-blue-500/50 transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #0088cc, #0066aa)',
                boxShadow: '0 4px 20px rgba(0, 136, 204, 0.4)'
              }}
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-tg-hint mb-0.5 uppercase tracking-wider">Написать в Telegram</div>
              <div className="text-lg font-bold text-white">@{telegramUsername}</div>
            </div>
            <div className="text-tg-hint group-hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* Телефон */}
          <button
            onClick={() => window.open(`tel:${phoneNumber.replace(/\s+/g, '').replace(/[()]/g, '').replace(/-/g, '')}`, '_blank')}
            className="flex items-center gap-3 p-4 tg-card transition-all hover:scale-[1.01] active:scale-[0.98] group w-full text-left"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg group-hover:shadow-green-500/50 transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-tg-hint mb-0.5 uppercase tracking-wider">Позвонить</div>
              <div className="text-lg font-bold text-white">{phoneNumber}</div>
            </div>
            <div className="text-tg-hint group-hover:text-green-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Сообщество */}
          <a
            href="https://t.me/dtm_auto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 tg-card transition-all hover:scale-[1.01] active:scale-[0.98] group"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg group-hover:shadow-purple-500/50 transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
            >
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-tg-hint mb-0.5 uppercase tracking-wider">Сообщество</div>
              <div className="text-lg font-bold text-white">@dtm_auto</div>
            </div>
            <div className="text-tg-hint group-hover:text-purple-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* Время работы */}
          <div className="tg-card p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-tg-accent/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(204, 0, 58, 0.2), rgba(204, 0, 58, 0.1))'
                }}
              >
                <Clock className="w-5 h-5 text-tg-accent" />
              </div>
              <h3 className="text-lg font-bold text-white brand-name uppercase tracking-wider">Время работы</h3>
            </div>
            
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-center p-2.5 rounded-lg"
                style={{
                  background: 'rgba(15, 14, 24, 0.5)'
                }}
              >
                <span className="text-tg-hint font-medium uppercase text-xs">Пн - Пт</span>
                <span className="font-bold text-base text-white">09:00 - 21:00</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg"
                style={{
                  background: 'rgba(15, 14, 24, 0.5)'
                }}
              >
                <span className="text-tg-hint font-medium uppercase text-xs">Сб - Вс</span>
                <span className="font-bold text-base text-white">10:00 - 20:00</span>
              </div>
            </div>
          </div>

          {/* Информационный блок */}
          <div className="tg-card p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(204, 0, 58, 0.1), rgba(204, 0, 58, 0.05))',
              borderColor: 'rgba(204, 0, 58, 0.3)'
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-tg-accent mt-1.5"></div>
              <div>
                <p className="text-sm leading-relaxed text-tg-hint">
                  Мы готовы ответить на ваши вопросы и помочь с выбором автомобиля. 
                  Выберите удобный способ связи!
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Декоративный элемент внизу */}
      <div className="h-0.5 w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(204, 0, 58, 0.5), transparent)'
        }}
      ></div>

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
