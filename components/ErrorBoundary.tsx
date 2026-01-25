'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-tg-bg">
          <div className="tg-card p-6 max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-tg-text">
                Произошла ошибка
              </h2>
              <p className="text-sm text-tg-hint">
                Что-то пошло не так. Пожалуйста, перезагрузите приложение.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-tg-hint cursor-pointer hover:text-tg-text">
                  Детали ошибки
                </summary>
                <pre className="mt-2 p-2 bg-tg-secondary-bg rounded text-xs text-tg-text overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full tg-button flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
