'use client';

import { useEffect, useLayoutEffect } from 'react';
import { initTelegramWebApp, getTelegramWebApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  // Функция для принудительного разворачивания
  const forceExpand = () => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Пробуем fullscreen (API 8.0+)
      if (tg.requestFullscreen && !tg.isFullscreen) {
        try {
          tg.requestFullscreen();
        } catch (e) {}
      }
    }
  };

  // Используем useLayoutEffect для раннего expand (до отрисовки)
  useLayoutEffect(() => {
    forceExpand();
  }, []);

  useEffect(() => {
    const tg = initTelegramWebApp();
    
    if (tg) {
      // Сообщаем Telegram что приложение готово
      tg.ready();
      
      // Разворачиваем на весь экран
      tg.expand();
      
      // Повторные попытки expand для надёжности
      setTimeout(() => forceExpand(), 50);
      setTimeout(() => forceExpand(), 100);
      setTimeout(() => forceExpand(), 200);
      setTimeout(() => forceExpand(), 500);
      setTimeout(() => forceExpand(), 1000);
      
      // Отключаем вертикальные свайпы (закрытие приложения) - API 7.7+
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      
      // Настраиваем header (прозрачный для fullscreen эффекта)
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#04030E');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#04030E');
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
      
      // При изменении видимости страницы - снова expand
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          forceExpand();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
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
