'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Car, Heart, BarChart3, Phone, Settings } from 'lucide-react';
import { isAdmin } from '@/lib/telegram';
import { useFavorites } from '@/lib/useFavorites';
import { supabase } from '@/lib/supabase';
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
  const [totalSold, setTotalSold] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsAdminUser(isAdmin());
    loadSoldCount();
    
    // Анимация появления снизу
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadSoldCount = async () => {
    try {
      const [soldResult, settingsResult] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('settings').select('manual_sold_count').eq('id', 1).single()
      ]);

      const dbSold = soldResult.count || 0;
      const manualSold = settingsResult.data?.manual_sold_count || 0;
      setTotalSold(dbSold + manualSold);
    } catch (error) {
      console.error('Error loading sold count:', error);
    }
  };

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

        {/* Продано */}
        <button 
          onClick={() => handleNavigate('/sold')}
          className={`refined-nav-button ${isActive('/sold') ? 'active' : ''}`}
        >
          <BarChart3 className="w-6 h-6" />
          {totalSold > 0 && (
            <span className="absolute top-1 right-2 bg-amber-500 text-white text-xs px-1.5 rounded-full font-bold animate-pulse">
              {totalSold}
            </span>
          )}
          <span className="text-xs font-semibold">Продано</span>
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
