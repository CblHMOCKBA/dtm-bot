'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

export default function OnlineCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Генерируем случайное число от 3 до 12 для реалистичности
    const baseCount = Math.floor(Math.random() * 10) + 3;
    setCount(baseCount);

    // Периодически немного меняем число
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(2, Math.min(15, newCount));
      });
    }, 30000); // каждые 30 секунд

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-tg-hint">
      <div className="relative flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500 online-indicator"></div>
        <Users className="w-3.5 h-3.5" />
        <span>{count} онлайн</span>
      </div>
    </div>
  );
}
