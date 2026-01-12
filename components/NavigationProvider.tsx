'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type NavigationDirection = 'forward' | 'back' | 'none';

interface NavigationContextType {
  direction: NavigationDirection;
  setDirection: (dir: NavigationDirection) => void;
  navigateForward: () => void;
  navigateBack: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  direction: 'none',
  setDirection: () => {},
  navigateForward: () => {},
  navigateBack: () => {},
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

  useEffect(() => {
    if (prevPath && prevPath !== pathname) {
      const prevLevel = getPageLevel(prevPath);
      const currentLevel = getPageLevel(pathname);
      
      if (currentLevel > prevLevel) {
        setDirection('forward');
      } else if (currentLevel < prevLevel) {
        setDirection('back');
      } else {
        // Тот же уровень - определяем по алфавиту или оставляем forward
        setDirection('forward');
      }
    }
    setPrevPath(pathname);
    
    // Сбрасываем направление после анимации
    const timer = setTimeout(() => {
      setDirection('none');
    }, 400);
    
    return () => clearTimeout(timer);
  }, [pathname, prevPath]);

  const navigateForward = useCallback(() => {
    setDirection('forward');
  }, []);

  const navigateBack = useCallback(() => {
    setDirection('back');
  }, []);

  return (
    <NavigationContext.Provider value={{ direction, setDirection, navigateForward, navigateBack }}>
      {children}
    </NavigationContext.Provider>
  );
}
