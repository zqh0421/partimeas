type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  // Specific methods for Google Sheets operations
  googleSheetsRequest(operation: string, spreadsheetId: string, sheetName: string): void {
    this.debug(`Google Sheets ${operation}`, { spreadsheetId, sheetName });
  }

  googleSheetsSuccess(operation: string, spreadsheetId: string, rowCount: number): void {
    this.info(`Google Sheets ${operation} successful`, { spreadsheetId, rowCount });
  }

  googleSheetsError(operation: string, spreadsheetId: string, error: Error): void {
    this.error(`Google Sheets ${operation} failed`, error, { spreadsheetId });
  }

  cacheHit(cacheKey: string): void {
    this.debug('Cache hit', { cacheKey });
  }

  cacheMiss(cacheKey: string): void {
    this.debug('Cache miss', { cacheKey });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export specific loggers for different modules
export const googleSheetsLogger = {
  request: (operation: string, spreadsheetId: string, sheetName: string) => 
    logger.googleSheetsRequest(operation, spreadsheetId, sheetName),
  success: (operation: string, spreadsheetId: string, rowCount: number) => 
    logger.googleSheetsSuccess(operation, spreadsheetId, rowCount),
  error: (operation: string, spreadsheetId: string, error: Error) => 
    logger.googleSheetsError(operation, spreadsheetId, error)
};

export const cacheLogger = {
  hit: (cacheKey: string) => logger.cacheHit(cacheKey),
  miss: (cacheKey: string) => logger.cacheMiss(cacheKey)
};