'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { getTelegramWebApp } from '@/lib/telegram';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({ 
  isFavorite, 
  onToggle, 
  size = 'md',
  className = ''
}: FavoriteButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    const tg = getTelegramWebApp();
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizes[size]} 
        rounded-full 
        flex items-center justify-center 
        transition-all duration-200
        ${isFavorite 
          ? 'bg-red-500/20 text-red-500' 
          : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'
        }
        backdrop-blur-sm
        active:scale-90
        ${isAnimating ? 'heart-pop' : ''}
        ${className}
      `}
      aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <Heart 
        className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''}`} 
      />
    </button>
  );
}
