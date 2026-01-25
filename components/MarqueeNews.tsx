'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

export default function MarqueeNews() {
  const [news, setNews] = useState<string[]>([]);

  useEffect(() => {
    loadLatestCars();
  }, []);

  const loadLatestCars = async () => {
    try {
      const { data } = await supabase
        .from('cars')
        .select('brand, model, year')
        .neq('status', 'sold')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const newsItems = data.map(car => `${car.brand} ${car.model} ${car.year}`);
        setNews(newsItems);
      }
    } catch (e) {
      console.error('Error loading news:', e);
    }
  };

  if (news.length === 0) return null;

  // Дублируем для бесшовной анимации
  const marqueeText = news.join('  •  ');

  return (
    <div className="overflow-hidden bg-gradient-to-r from-tg-accent/10 via-tg-accent/5 to-tg-accent/10 rounded-xl py-2">
      <div className="flex items-center">
        <Sparkles className="w-4 h-4 text-tg-accent flex-shrink-0 ml-3 mr-2" />
        <div className="overflow-hidden flex-1 relative">
          <div className="flex whitespace-nowrap">
            <span className="animate-marquee inline-block text-sm text-tg-hint">
              <span className="text-tg-accent font-semibold">Новые:</span>
              {'  '}{marqueeText}{'  •  '}{marqueeText}{'  •  '}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
