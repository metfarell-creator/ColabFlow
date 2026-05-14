export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];

  log(error: Error | string, metadata?: Record<string, any>) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    const newLog: ErrorLog = {
      id: crypto.randomUUID(),
      message,
      stack,
      timestamp: Date.now(),
      metadata,
    };

    this.logs.push(newLog);
    
    // In a real app, you would send this to a backend or service like Sentry/LogRocket
    console.error('[ErrorLogger]', newLog);
    
    // Optional: Persist to localStorage for debugging
    try {
      const savedLogs = JSON.parse(localStorage.getItem('colabflow_error_logs') || '[]');
      localStorage.setItem('colabflow_error_logs', JSON.stringify([newLog, ...savedLogs].slice(0, 50)));
    } catch (e) {
      console.warn('Failed to persist error log', e);
    }
  }

  getLogs(): ErrorLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('colabflow_error_logs');
  }
}

export const errorLogger = new ErrorLogger();
