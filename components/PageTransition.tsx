'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from './NavigationProvider';

interface PageTransitionProps {
  children: ReactNode;
}

interface PageState {
  key: string;
  content: ReactNode;
  stage: 'enter' | 'idle' | 'exit';
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { direction } = useNavigation();
  const pathname = usePathname();
  const [pages, setPages] = useState<PageState[]>([
    { key: pathname, content: children, stage: 'idle' }
  ]);
  const isAnimating = useRef(false);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // Если путь не изменился - просто обновляем контент
    if (prevPathRef.current === pathname) {
      setPages([{ key: pathname, content: children, stage: 'idle' }]);
      return;
    }

    prevPathRef.current = pathname;

    // Если direction === 'none', обновляем без анимации
    if (direction === 'none') {
      setPages([{ key: pathname, content: children, stage: 'idle' }]);
      return;
    }

    // Если уже анимируем - принудительно завершаем
    if (isAnimating.current) {
      setPages([{ key: pathname, content: children, stage: 'idle' }]);
      isAnimating.current = false;
      return;
    }

    isAnimating.current = true;

    // Добавляем новую страницу с enter, старую с exit
    setPages(prev => {
      const oldPage = prev.find(p => p.stage !== 'exit');
      if (!oldPage) {
        return [{ key: pathname, content: children, stage: 'enter' }];
      }
      return [
        { ...oldPage, stage: 'exit' },
        { key: pathname, content: children, stage: 'enter' }
      ];
    });

    // Через время анимации убираем старую страницу
    const timer = setTimeout(() => {
      setPages([{ key: pathname, content: children, stage: 'idle' }]);
      isAnimating.current = false;
    }, 380);

    return () => {
      clearTimeout(timer);
    };
  }, [children, pathname, direction]);

  const getAnimationClass = (stage: 'enter' | 'idle' | 'exit') => {
    if (stage === 'idle') return '';
    
    if (stage === 'enter') {
      return direction === 'forward' ? 'page-enter-forward' : 'page-enter-back';
    }
    
    if (stage === 'exit') {
      return direction === 'forward' ? 'page-exit-forward' : 'page-exit-back';
    }
    
    return '';
  };

  return (
    <div className="page-transition-wrapper">
      {pages.map((page, index) => (
        <div 
          key={`${page.key}-${page.stage}-${index}`}
          className={`page-transition-container ${getAnimationClass(page.stage)}`}
          style={{
            position: page.stage === 'exit' ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            right: 0,
            zIndex: page.stage === 'exit' ? 0 : 1,
            pointerEvents: page.stage === 'exit' ? 'none' : 'auto',
          }}
        >
          {page.content}
        </div>
      ))}
    </div>
  );
}
