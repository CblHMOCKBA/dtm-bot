'use client';

import { ReactNode, useRef, useLayoutEffect, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from './NavigationProvider';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { direction } = useNavigation();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(pathname);
  const isFirstRender = useRef(true);
  const [isReady, setIsReady] = useState(false);

  // Защита от множественных рендеров при первой загрузке
  useEffect(() => {
    // Небольшая задержка чтобы дождаться полной инициализации
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Используем useLayoutEffect для синхронного обновления DOM
  useLayoutEffect(() => {
    // Пропускаем первый рендер
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Если путь не изменился - ничего не делаем
    if (prevPathRef.current === pathname) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    prevPathRef.current = pathname;

    // Если direction === 'none', без анимации
    if (direction === 'none') {
      return;
    }

    // Применяем анимацию входа
    const animationClass = direction === 'forward' ? 'page-enter-forward' : 'page-enter-back';
    container.classList.add(animationClass);

    // Убираем класс анимации после завершения
    const timer = setTimeout(() => {
      container.classList.remove(animationClass);
    }, 350);

    return () => {
      clearTimeout(timer);
      container.classList.remove('page-enter-forward', 'page-enter-back');
    };
  }, [pathname, direction]);

  // Показываем контент только когда всё готово
  return (
    <div className="page-transition-wrapper">
      <div 
        ref={containerRef}
        className="page-transition-container"
        style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        {children}
      </div>
    </div>
  );
}
