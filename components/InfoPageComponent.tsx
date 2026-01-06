'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp } from '@/lib/telegram';
import { ArrowLeft, Phone, Users, MessageCircle, CheckCircle, Shield, Zap, Star, Award } from 'lucide-react';
import Image from 'next/image';

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
  const contactUsername = process.env.NEXT_PUBLIC_CONTACT_USERNAME || 'FixeR050';

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

  const handleGroup = () => {
    window.open('https://t.me/Topgearmsc', '_blank');
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
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-md z-10 border-b border-tg-hint/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />

          <button
            onClick={() => window.open(`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || '+79806790176'}`, '_blank')}
            className="w-10 h-10 rounded-full bg-tg-accent/10 flex items-center justify-center text-tg-accent hover:bg-tg-accent/20 transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-6">
        {/* Иконка и заголовок */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-tg-accent/20 to-tg-accent/5 flex items-center justify-center">
            <Icon className="w-10 h-10 text-tg-accent" />
          </div>
          
          <div>
            <p className="text-sm text-tg-accent font-semibold uppercase tracking-wider mb-2">
              {data.subtitle}
            </p>
            <h1 className="text-2xl font-bold text-gradient">
              {data.title}
            </h1>
          </div>
        </div>

        {/* Список пунктов */}
        <div className="tg-card p-5 space-y-3">
          {data.items.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-tg-secondary-bg/50 hover:bg-tg-accent/5 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-tg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-tg-accent" />
              </div>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>

        {/* Преимущество */}
        <div className="tg-card p-5 bg-gradient-to-br from-tg-accent/10 to-transparent border-tg-accent/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-tg-accent/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-tg-accent" />
            </div>
            <div>
              <p className="text-xs text-tg-accent font-semibold uppercase tracking-wider mb-1">
                Преимущество
              </p>
              <p className="font-medium">{data.advantage}</p>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleContact}
            className="w-full tg-button flex items-center justify-center gap-2 py-4"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">Связаться с менеджером</span>
          </button>

          <button
            onClick={handleGroup}
            className="w-full tg-button-secondary tg-button flex items-center justify-center gap-2 py-4"
          >
            <Users className="w-5 h-5" />
            <span className="font-semibold">Наш Telegram</span>
          </button>
        </div>

        {/* Racing line декор */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-tg-accent to-transparent opacity-30 mt-8"></div>
      </div>
    </div>
  );
}
