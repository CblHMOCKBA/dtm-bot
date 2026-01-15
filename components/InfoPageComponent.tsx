'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp } from '@/lib/telegram';
import { CheckCircle, Shield, Zap, Star, Award, MessageCircle } from 'lucide-react';

interface InfoPageData {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
  advantage: string;
}

interface InfoPageProps {
  pageId: 'check' | 'tradein' | 'documents' | 'warranty';
}

const icons = {
  check: Shield,
  tradein: Zap,
  documents: Star,
  warranty: Award,
};

export default function InfoPageComponent({ pageId }: InfoPageProps) {
  const router = useRouter();
  const [data, setData] = useState<InfoPageData | null>(null);
  const [loading, setLoading] = useState(true);

  const Icon = icons[pageId];
  const contactUsername = process.env.NEXT_PUBLIC_CONTACT_USERNAME || 'dtm_moscow';

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/'));
    }

    loadData();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router, pageId]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('info_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;
      setData(data);
    } catch (error) {
      console.error('Error loading info page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    const message = encodeURIComponent(`Здравствуйте! Хочу узнать подробнее о "${data?.subtitle || ''}"`);
    window.open(`https://t.me/${contactUsername}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tg-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-tg-hint">Информация не найдена</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка - только DTM */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-md z-10 border-b border-tg-hint/10">
        <div className="flex items-center justify-center px-4 py-3">
          {/* DTM логотип по центру */}
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
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Иконка и заголовок */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tg-accent/20 to-tg-accent/5 flex items-center justify-center">
            <Icon className="w-8 h-8 text-tg-accent" />
          </div>
          
          <div>
            <p className="text-xs text-tg-accent font-semibold uppercase tracking-wider mb-1">
              {data.subtitle}
            </p>
            <h1 className="text-xl font-bold text-gradient">
              {data.title}
            </h1>
          </div>
        </div>

        {/* Список пунктов */}
        <div className="tg-card p-4 space-y-2">
          {data.items.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-tg-secondary-bg/50 hover:bg-tg-accent/5 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-tg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-tg-accent" />
              </div>
              <span className="text-xs font-medium">{item}</span>
            </div>
          ))}
        </div>

        {/* Преимущество */}
        <div className="tg-card p-4 bg-gradient-to-br from-tg-accent/10 to-transparent border-tg-accent/20">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tg-accent/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-tg-accent" />
            </div>
            <div>
              <p className="text-[10px] text-tg-accent font-semibold uppercase tracking-wider mb-0.5">
                Преимущество
              </p>
              <p className="text-sm font-medium">{data.advantage}</p>
            </div>
          </div>
        </div>

        {/* Кнопка связи */}
        <div className="pt-3">
          <button
            onClick={handleContact}
            className="w-full tg-button flex items-center justify-center gap-2 py-3.5"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Связаться с менеджером</span>
          </button>
        </div>

        {/* Racing line декор */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-tg-accent to-transparent opacity-30 mt-6"></div>
      </div>
    </div>
  );
}
