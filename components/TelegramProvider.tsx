'use client';

import { useEffect, useLayoutEffect } from 'react';
import { initTelegramWebApp, getTelegramWebApp, isMobilePlatform, isDesktopOrWebPlatform } from '@/lib/telegram';

/**
 * Проверка версии Telegram WebApp API
 * @param required - минимальная требуемая версия (например "6.1")
 */
function isVersionAtLeast(required: string): boolean {
  const tg = getTelegramWebApp();
  if (!tg?.version) return false;
  
  const current = tg.version.split('.').map(Number);
  const req = required.split('.').map(Number);
  
  for (let i = 0; i < req.length; i++) {
    const c = current[i] || 0;
    const r = req[i] || 0;
    if (c > r) return true;
    if (c < r) return false;
  }
  return true;
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  // Функция для разворачивания - ТОЛЬКО для мобильных платформ
  const forceExpand = () => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    
    // Всегда сообщаем что приложение готово
    tg.ready();
    
    // expand() и fullscreen только для мобильных приложений (Android/iOS)
    if (isMobilePlatform()) {
      tg.expand();
      
      // Пробуем fullscreen (API 8.0+) - только для мобильных!
      if (isVersionAtLeast('8.0') && tg.requestFullscreen && !tg.isFullscreen) {
        try {
          tg.requestFullscreen();
        } catch (e) {
          // Игнорируем ошибки fullscreen
        }
      }
    }
  };

  // Используем useLayoutEffect для раннего expand (до отрисовки)
  // Но ТОЛЬКО для мобильных платформ
  useLayoutEffect(() => {
    if (isMobilePlatform()) {
      forceExpand();
    } else {
      // Для десктопа просто вызываем ready()
      const tg = getTelegramWebApp();
      if (tg) {
        tg.ready();
      }
    }
  }, []);

  useEffect(() => {
    const tg = initTelegramWebApp();
    
    if (tg) {
      // Сообщаем Telegram что приложение готово
      tg.ready();
      
      // Разворачиваем на весь экран ТОЛЬКО для мобильных
      if (isMobilePlatform()) {
        tg.expand();
        
        // Повторные попытки expand для надёжности - только мобильные
        setTimeout(() => forceExpand(), 50);
        setTimeout(() => forceExpand(), 100);
        setTimeout(() => forceExpand(), 200);
        setTimeout(() => forceExpand(), 500);
        setTimeout(() => forceExpand(), 1000);
      }
      
      // Отключаем вертикальные свайпы (закрытие приложения) - API 7.7+
      // Это актуально только для мобильных
      if (isMobilePlatform() && isVersionAtLeast('7.7') && tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      
      // Настраиваем цвета header и background - требуется версия 6.1+
      if (isVersionAtLeast('6.1')) {
        if (tg.setHeaderColor) {
          tg.setHeaderColor('#04030E');
        }
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor('#04030E');
        }
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
      
      // При изменении видимости страницы - снова expand (только мобильные)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isMobilePlatform()) {
          forceExpand();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // Блокируем свайп-закрытие когда скролл вверху страницы (только для мобильных)
    if (!isMobilePlatform()) {
      return;
    }
    
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
