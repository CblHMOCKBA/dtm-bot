'use client';

import { useEffect, useRef } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (initialized.current) return;
    initialized.current = true;

    const tg = getTelegramWebApp();
    
    if (tg) {
      // Сообщаем Telegram что приложение готово
      tg.ready();
      
      // Разворачиваем на весь экран - ОДИН раз
      tg.expand();
      
      // Отключаем вертикальные свайпы (закрытие приложения) - API 7.7+
      if (tg.disableVerticalSwipes) {
        try {
          tg.disableVerticalSwipes();
        } catch (e) {}
      }
      
      // Настраиваем цвета header
      if (tg.setHeaderColor) {
        try {
          tg.setHeaderColor('#04030E');
        } catch (e) {}
      }
      if (tg.setBackgroundColor) {
        try {
          tg.setBackgroundColor('#04030E');
        } catch (e) {}
      }
      
      // Устанавливаем CSS переменные для viewport
      const setViewportHeight = () => {
        const vh = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight;
        document.documentElement.style.setProperty('--tg-viewport-height', `${vh}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight || vh}px`);
      };
      
      setViewportHeight();
      
      // Слушаем изменения viewport
      if (tg.onEvent) {
        tg.onEvent('viewportChanged', setViewportHeight);
      }
    }

    // Блокируем свайп-закрытие когда скролл вверху страницы
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Если страница в самом верху и пользователь тянет вниз - блокируем
      if (scrollTop <= 0 && currentY > startY) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return <>{children}</>;
}
