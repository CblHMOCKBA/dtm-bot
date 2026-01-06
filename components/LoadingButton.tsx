'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  loadingText?: string;
  icon?: ReactNode;
}

export function LoadingButton({
  loading = false,
  children,
  loadingText,
  icon,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} ${loading || disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {icon}
          <span>{children}</span>
        </span>
      )}
    </button>
  );
}
