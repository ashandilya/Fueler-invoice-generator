// Comprehensive Error Handling Utility
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  OFFLINE = 'OFFLINE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
  stack?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Main error handling method
  handleError(error: any, context?: string, userId?: string): AppError {
    const appError = this.parseError(error, context, userId);
    
    // Log error
    this.logError(appError);
    
    // Add to queue for potential retry
    this.addToQueue(appError);
    
    // Show user notification
    this.showUserNotification(appError);
    
    return appError;
  }

  // Parse different types of errors
  private parseError(error: any, context?: string, userId?: string): AppError {
    const timestamp = new Date();
    const baseError = {
      timestamp,
      userId,
      context,
      stack: error?.stack
    };

    // Network errors
    if (!navigator.onLine) {
      return {
        ...baseError,
        type: ErrorType.OFFLINE,
        severity: ErrorSeverity.HIGH,
        message: 'Device is offline',
        userMessage: 'You appear to be offline. Please check your internet connection and try again.'
      };
    }

    // Fetch/Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        ...baseError,
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: `Network error: ${error.message}`,
        userMessage: 'Network connection failed. Please check your internet connection and try again.'
      };
    }

    // Supabase/API errors
    if (error?.code || error?.status) {
      return this.parseAPIError(error, baseError);
    }

    // Validation errors
    if (error?.name === 'ValidationError' || error?.type === 'validation') {
      return {
        ...baseError,
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Validation failed',
        userMessage: error.userMessage || 'Please check your input and try again.',
        details: error.details
      };
    }

    // Timeout errors
    if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
      return {
        ...baseError,
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: 'Request timed out',
        userMessage: 'The request is taking longer than usual. Please try again.'
      };
    }

    // Unknown errors
    return {
      ...baseError,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error?.message || 'Unknown error occurred',
      userMessage: 'Something went wrong. Please try again or contact support if the problem persists.'
    };
  }

  // Parse API-specific errors
  private parseAPIError(error: any, baseError: any): AppError {
    const status = error.status || error.code;
    const message = error.message || error.details || 'API error occurred';

    switch (status) {
      case 400:
        return {
          ...baseError,
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          message: `Bad request: ${message}`,
          userMessage: 'Invalid data provided. Please check your input and try again.',
          code: '400'
        };

      case 401:
        return {
          ...baseError,
          type: ErrorType.AUTH,
          severity: ErrorSeverity.HIGH,
          message: `Authentication failed: ${message}`,
          userMessage: 'Your session has expired. Please sign in again.',
          code: '401'
        };

      case 403:
        return {
          ...baseError,
          type: ErrorType.PERMISSION,
          severity: ErrorSeverity.HIGH,
          message: `Permission denied: ${message}`,
          userMessage: 'You don\'t have permission to perform this action.',
          code: '403'
        };

      case 404:
        return {
          ...baseError,
          type: ErrorType.API,
          severity: ErrorSeverity.MEDIUM,
          message: `Resource not found: ${message}`,
          userMessage: 'The requested resource was not found.',
          code: '404'
        };

      case 409:
        return {
          ...baseError,
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          message: `Conflict: ${message}`,
          userMessage: 'This data already exists or conflicts with existing data.',
          code: '409'
        };

      case 429:
        return {
          ...baseError,
          type: ErrorType.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: `Rate limit exceeded: ${message}`,
          userMessage: 'Too many requests. Please wait a moment before trying again.',
          code: '429'
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          ...baseError,
          type: ErrorType.API,
          severity: ErrorSeverity.HIGH,
          message: `Server error (${status}): ${message}`,
          userMessage: 'Server is temporarily unavailable. Please try again in a few minutes.',
          code: status.toString()
        };

      default:
        return {
          ...baseError,
          type: ErrorType.API,
          severity: ErrorSeverity.MEDIUM,
          message: `API error (${status}): ${message}`,
          userMessage: 'An error occurred while processing your request. Please try again.',
          code: status?.toString()
        };
    }
  }

  // Log errors with different levels
  private logError(error: AppError): void {
    const logData = {
      timestamp: error.timestamp.toISOString(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: error.context,
      userId: error.userId,
      code: error.code,
      details: error.details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Console logging based on severity
    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('🔵 Low severity error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('🟡 Medium severity error:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('🟠 High severity error:', logData);
        break;
      case ErrorSeverity.CRITICAL:
        console.error('🔴 CRITICAL ERROR:', logData);
        break;
    }

    // Send to external logging service (implement as needed)
    this.sendToLoggingService(logData);
  }

  // Send errors to external logging service
  private async sendToLoggingService(logData: any): Promise<void> {
    try {
      // Only send high and critical errors to external service
      if (logData.severity === ErrorSeverity.HIGH || logData.severity === ErrorSeverity.CRITICAL) {
        // Example: Send to your logging service
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logData)
        // });
      }
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError);
    }
  }

  // Add error to retry queue
  private addToQueue(error: AppError): void {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
    this.errorQueue.push(error);
  }

  // Show user-friendly notifications
  private showUserNotification(error: AppError): void {
    // This will be implemented with the toast system
    const event = new CustomEvent('showErrorToast', {
      detail: {
        message: error.userMessage,
        type: error.type,
        severity: error.severity
      }
    });
    window.dispatchEvent(event);
  }

  // Retry mechanism
  async retry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    const retryKey = `${context}-${Date.now()}`;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.retryAttempts.delete(retryKey);
        return result;
      } catch (error) {
        lastError = error;
        this.retryAttempts.set(retryKey, attempt);

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    this.retryAttempts.delete(retryKey);
    throw this.handleError(lastError, `${context} (after ${maxRetries} retries)`);
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorQueue.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    };

    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // Clear error queue
  clearErrors(): void {
    this.errorQueue = [];
    this.retryAttempts.clear();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Validation error creator
export const createValidationError = (field: string, message: string, value?: any): Error => {
  const error = new Error(message);
  error.name = 'ValidationError';
  (error as any).type = 'validation';
  (error as any).field = field;
  (error as any).value = value;
  (error as any).userMessage = message;
  return error;
};

// Network error creator
export const createNetworkError = (message: string, status?: number): Error => {
  const error = new Error(message);
  error.name = 'NetworkError';
  (error as any).status = status;
  return error;
};