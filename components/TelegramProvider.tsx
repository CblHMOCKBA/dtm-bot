'use client';

import { useEffect, useLayoutEffect } from 'react';
import { initTelegramWebApp, getTelegramWebApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  // Используем useLayoutEffect для раннего expand (до отрисовки)
  useLayoutEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      // Мгновенно разворачиваем на весь экран
      tg.expand();
    }
  }, []);

  useEffect(() => {
    const tg = initTelegramWebApp();
    
    if (tg) {
      // Повторный expand для надёжности
      tg.expand();
      
      // Ещё раз через небольшую задержку (для старых версий Telegram)
      setTimeout(() => tg.expand(), 100);
      setTimeout(() => tg.expand(), 500);
      
      // Отключаем вертикальные свайпы Telegram (закрытие приложения) - API 7.7+
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
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
