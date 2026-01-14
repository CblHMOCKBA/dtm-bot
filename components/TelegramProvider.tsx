'use client';

import { useEffect, useLayoutEffect } from 'react';
import { initTelegramWebApp, getTelegramWebApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  // Используем useLayoutEffect для раннего expand (до отрисовки)
  useLayoutEffect(() => {
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
      
      // Применяем тему Telegram
      document.documentElement.setAttribute(
        'data-theme',
        tg.colorScheme
      );
      
      // Устанавливаем цвета из темы
      const root = document.documentElement;
      const theme = tg.themeParams;
      
      if (theme.bg_color) root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
      if (theme.text_color) root.style.setProperty('--tg-theme-text-color', theme.text_color);
      if (theme.hint_color) root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
      if (theme.link_color) root.style.setProperty('--tg-theme-link-color', theme.link_color);
      if (theme.button_color) root.style.setProperty('--tg-theme-button-color', theme.button_color);
      if (theme.button_text_color) root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
      if (theme.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
      
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
