'use client';

import { useEffect } from 'react';
import { initTelegramWebApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const tg = initTelegramWebApp();
    
    if (tg) {
      // Отключаем вертикальные свайпы Telegram (закрытие приложения) - API 7.7+
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      
      // Разворачиваем на весь экран
      tg.expand();
      
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
  }, []);

  return <>{children}</>;
}
