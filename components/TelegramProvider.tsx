'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { initTelegramWebApp, getTelegramWebApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  // Защита от множественных инициализаций
  const isInitialized = useRef(false);
  
  // Используем useLayoutEffect для раннего expand (до отрисовки)
  useLayoutEffect(() => {
    if (isInitialized.current) return;
    
    const tg = getTelegramWebApp();
    if (tg) {
      // Мгновенно разворачиваем на весь экран
      tg.ready();
      tg.expand();
      
      // Пробуем fullscreen (API 8.0+)
      if (tg.requestFullscreen) {
        try {
          tg.requestFullscreen();
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    // Защита от повторной инициализации
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    const tg = initTelegramWebApp();
    
    if (tg) {
      // Сообщаем Telegram что приложение готово
      tg.ready();
      
      // Разворачиваем на весь экран
      tg.expand();
      
      // Повторные попытки expand для надёжности
      setTimeout(() => tg.expand(), 50);
      setTimeout(() => tg.expand(), 150);
      setTimeout(() => tg.expand(), 300);
      
      // Пытаемся открыть в fullscreen (Telegram API 8.0+)
      if (tg.requestFullscreen && !tg.isFullscreen) {
        try {
          tg.requestFullscreen();
        } catch (e) {}
      }
      
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
      
      // Устанавливаем CSS переменные для viewport - используем СТАБИЛЬНУЮ высоту
      const setViewportHeight = () => {
        // viewportStableHeight не меняется при открытии клавиатуры
        const stableHeight = tg.viewportStableHeight || window.innerHeight;
        const currentHeight = tg.viewportHeight || window.innerHeight;
        
        document.documentElement.style.setProperty('--tg-viewport-height', `${currentHeight}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${stableHeight}px`);
        
        // Сохраняем начальную высоту для фона
        if (!document.documentElement.style.getPropertyValue('--tg-initial-height')) {
          document.documentElement.style.setProperty('--tg-initial-height', `${stableHeight}px`);
        }
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
