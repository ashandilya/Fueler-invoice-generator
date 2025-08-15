import { useCallback } from 'react';
import { errorHandler, ErrorType, ErrorSeverity, createValidationError, createNetworkError } from '../utils/errorHandler';
import { useAuth } from './useAuth';

export const useErrorHandler = () => {
  const { user } = useAuth();

  const handleError = useCallback((error: any, context?: string) => {
    return errorHandler.handleError(error, context, user?.id);
  }, [user?.id]);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    options?: {
      showLoading?: boolean;
      showSuccess?: boolean;
      successMessage?: string;
      retries?: number;
    }
  ): Promise<T | null> => {
    try {
      // Check online status
      if (!navigator.onLine) {
        throw createNetworkError('Device is offline');
      }

      // Show loading if requested
      if (options?.showLoading) {
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Processing...',
            type: 'info',
            duration: 1000
          }
        });
        window.dispatchEvent(event);
      }

      // Execute operation with retry mechanism
      const result = await errorHandler.retry(
        operation,
        context,
        options?.retries || 3
      );

      // Show success message if requested
      if (options?.showSuccess) {
        const event = new CustomEvent('showSuccessToast', {
          detail: {
            message: options.successMessage || 'Operation completed successfully'
          }
        });
        window.dispatchEvent(event);
      }

      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  const validateField = useCallback((
    field: string,
    value: any,
    rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: any) => boolean;
      customMessage?: string;
    }
  ): string | null => {
    try {
      // Required validation
      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        throw createValidationError(field, `${field} is required`, value);
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && !value.trim())) {
        return null;
      }

      // String length validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          throw createValidationError(
            field,
            `${field} must be at least ${rules.minLength} characters long`,
            value
          );
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          throw createValidationError(
            field,
            `${field} must be no more than ${rules.maxLength} characters long`,
            value
          );
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
          throw createValidationError(
            field,
            `${field} format is invalid`,
            value
          );
        }
      }

      // Custom validation
      if (rules.custom && !rules.custom(value)) {
        throw createValidationError(
          field,
          rules.customMessage || `${field} is invalid`,
          value
        );
      }

      return null;
    } catch (error) {
      const appError = handleError(error, `Validation: ${field}`);
      return appError.userMessage;
    }
  }, [handleError]);

  const validateForm = useCallback((
    data: Record<string, any>,
    validationRules: Record<string, any>
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, data[field], validationRules[field]);
      if (error) {
        errors[field] = error;
      }
    });

    return errors;
  }, [validateField]);

  const getErrorStats = useCallback(() => {
    return errorHandler.getErrorStats();
  }, []);

  const clearErrors = useCallback(() => {
    errorHandler.clearErrors();
  }, []);

  return {
    handleError,
    handleAsyncOperation,
    validateField,
    validateForm,
    getErrorStats,
    clearErrors
  };
};