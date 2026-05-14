import React from 'react';
import { errorLogger } from '../services/errorLogger';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorLogger.log(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 transition-colors duration-300">
          <div className="max-w-md w-full border border-app-fg p-12 space-y-8 bg-card-bg shadow-2xl transition-colors duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 flex items-center justify-center rounded-full">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h1 className="font-serif italic text-3xl">Ой, щось пішло не так</h1>
              <p className="text-[11px] font-mono opacity-60 uppercase tracking-widest leading-relaxed">
                Сталася помилка під час роботи додатка. Ми вже зафіксували проблему.
              </p>
            </div>
            
            <div className="bg-app-fg/5 p-4 border border-app-fg/10">
              <p className="text-[10px] font-mono break-words text-red-800 dark:text-red-400">
                {this.state.error?.message}
              </p>
            </div>

            <button 
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-3 py-4 border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all group"
            >
              <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold">Перезавантажити</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
