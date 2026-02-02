'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Car, Heart, Phone, Settings, ArrowRightLeft } from 'lucide-react';
import { isAdmin } from '@/lib/telegram';
import { useFavorites } from '@/lib/useFavorites';
import { useNavigation } from '@/components/NavigationProvider';

interface BottomNavigationProps {
  className?: string;
}

export default function BottomNavigation({ className = '' }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { navigateForward } = useNavigation();
  const { count: favoritesCount } = useFavorites();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsAdminUser(isAdmin());
    
    // Анимация появления снизу
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (path: string) => {
    if (pathname !== path) {
      navigateForward();
      router.push(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 transition-all duration-500 ease-out ${className}`}
      style={{
        background: 'rgba(10, 10, 20, 0.4)',
        backdropFilter: 'blur(8px)',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-3xl mx-auto">
        {/* Каталог */}
        <button 
          onClick={() => handleNavigate('/')}
          className={`refined-nav-button ${isActive('/') ? 'active' : ''}`}
        >
          <Car className="w-6 h-6" />
          <span className="text-xs font-semibold">Каталог</span>
        </button>

        {/* Избранное */}
        <button 
          onClick={() => handleNavigate('/favorites')}
          className={`refined-nav-button ${isActive('/favorites') ? 'active' : ''}`}
        >
          <Heart className="w-6 h-6" />
          {favoritesCount > 0 && (
            <span className="absolute top-1 right-2 bg-tg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
              {favoritesCount}
            </span>
          )}
          <span className="text-xs font-semibold">Избранное</span>
        </button>

        {/* Trade-In */}
        <button 
          onClick={() => handleNavigate('/trade-in')}
          className={`refined-nav-button ${isActive('/trade-in') ? 'active' : ''}`}
        >
          <ArrowRightLeft className="w-6 h-6" />
          <span className="text-xs font-semibold">Trade-In</span>
        </button>

        {/* Контакты */}
        <button 
          onClick={() => handleNavigate('/contact')}
          className={`refined-nav-button ${isActive('/contact') ? 'active' : ''}`}
        >
          <Phone className="w-6 h-6" />
          <span className="text-xs font-semibold">Контакты</span>
        </button>

        {/* Админ (только для администраторов) */}
        {isAdminUser && (
          <button 
            onClick={() => handleNavigate('/admin')}
            className={`refined-nav-button ${isActive('/admin') ? 'active' : ''}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-semibold">Админ</span>
          </button>
        )}
      </div>
    </div>
  );
}
