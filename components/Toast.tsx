'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-500/20 border-green-500/50',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-red-500/20 border-red-500/50',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-500/20 border-blue-500/50',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  warning: {
    bg: 'bg-yellow-500/20 border-yellow-500/50',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
};

export function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  const style = toastStyles[type];
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={`${style.bg} border-2 rounded-lg p-4 shadow-lg backdrop-blur-sm animate-slide-up flex items-start gap-3 min-w-[280px] max-w-[400px]`}
    >
      <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-tg-text flex-1">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-tg-hint hover:text-tg-text transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
