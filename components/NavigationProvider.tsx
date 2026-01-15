'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getTelegramWebApp } from '@/lib/telegram';

type NavigationDirection = 'forward' | 'back' | 'none';

interface NavigationContextType {
  direction: NavigationDirection;
  setDirection: (dir: NavigationDirection) => void;
  navigateForward: () => void;
  navigateBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  direction: 'none',
  setDirection: () => {},
  navigateForward: () => {},
  navigateBack: () => {},
  canGoBack: false,
});

export const useNavigation = () => useContext(NavigationContext);

// Иерархия страниц для определения направления
const pageHierarchy: Record<string, number> = {
  '/': 0,
  '/catalog': 1,
  '/car': 2,
  '/sold': 1,
  '/favorites': 1,
  '/contact': 1,
  '/info': 1,
  '/admin': 1,
};

const getPageLevel = (path: string): number => {
  // Точное совпадение
  if (pageHierarchy[path] !== undefined) {
    return pageHierarchy[path];
  }
  // Проверка вложенных путей
  for (const [key, level] of Object.entries(pageHierarchy)) {
    if (path.startsWith(key + '/')) {
      return level + 1;
    }
  }
  return 1;
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<NavigationDirection>('none');
  const [prevPath, setPrevPath] = useState<string>('');
  const pathname = usePathname();
  const router = useRouter();
  
  // Защита от множественных инициализаций
  const isInitialized = useRef(false);
  const isMounted = useRef(false);
  
  // Свайп-навигация
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  
  const canGoBack = pathname !== '/';

  // Инициализация - только один раз
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    
    if (prevPath && prevPath !== pathname) {
      const prevLevel = getPageLevel(prevPath);
      const currentLevel = getPageLevel(pathname);
      
      if (currentLevel > prevLevel) {
        setDirection('forward');
      } else if (currentLevel < prevLevel) {
        setDirection('back');
      } else {
        setDirection('forward');
      }
    }
    setPrevPath(pathname);
    
    // Сбрасываем направление после анимации
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setDirection('none');
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [pathname, prevPath]);

  // Обработка свайпа слева направо для навигации назад
  useEffect(() => {
    if (pathname === '/' || isInitialized.current) return;
    isInitialized.current = true;
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isSwiping.current = false;
      
      // Свайп работает только если начинается с левого края экрана (первые 30px)
      if (touch.clientX <= 30) {
        isSwiping.current = true;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      
      // Проверяем что свайп горизонтальный (deltaX больше deltaY)
      if (deltaX > 50 && deltaY < 50) {
        // Предотвращаем скролл во время свайпа
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      
      // Свайп вправо (назад) - минимум 80px и горизонтальный
      if (deltaX > 80 && deltaY < 100) {
        // Вибрация при навигации
        const tg = getTelegramWebApp();
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
        
        setDirection('back');
        router.push('/');
      }
      
      isSwiping.current = false;
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      isInitialized.current = false;
    };
  }, [pathname, router]);

  const navigateForward = useCallback(() => {
    setDirection('forward');
  }, []);

  const navigateBack = useCallback(() => {
    setDirection('back');
  }, []);

  return (
    <NavigationContext.Provider value={{ direction, setDirection, navigateForward, navigateBack, canGoBack }}>
      {children}
    </NavigationContext.Provider>
  );
}
