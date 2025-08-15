import React, { useState, useEffect } from 'react';
import Toast, { ToastMessage } from './Toast';
import { ErrorType, ErrorSeverity } from '../../utils/errorHandler';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Listen for error toast events
    const handleErrorToast = (event: CustomEvent) => {
      const { message, type, severity } = event.detail;
      showToast({
        message,
        type: getToastType(type, severity),
        errorType: type,
        severity
      });
    };

    // Listen for success toast events
    const handleSuccessToast = (event: CustomEvent) => {
      const { message } = event.detail;
      showToast({
        message,
        type: 'success'
      });
    };

    // Listen for general toast events
    const handleToast = (event: CustomEvent) => {
      showToast(event.detail);
    };

    window.addEventListener('showErrorToast', handleErrorToast as EventListener);
    window.addEventListener('showSuccessToast', handleSuccessToast as EventListener);
    window.addEventListener('showToast', handleToast as EventListener);

    return () => {
      window.removeEventListener('showErrorToast', handleErrorToast as EventListener);
      window.removeEventListener('showSuccessToast', handleSuccessToast as EventListener);
      window.removeEventListener('showToast', handleToast as EventListener);
    };
  }, []);

  const getToastType = (errorType: ErrorType, severity: ErrorSeverity): 'error' | 'warning' | 'info' => {
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      return 'error';
    }
    if (severity === ErrorSeverity.MEDIUM) {
      return 'warning';
    }
    return 'info';
  };

  const showToast = (toast: Partial<ToastMessage>) => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message: toast.message || 'Something happened',
      type: toast.type || 'info',
      severity: toast.severity,
      errorType: toast.errorType,
      duration: toast.duration || 5000,
      action: toast.action
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

// Utility functions for showing toasts
export const showSuccessToast = (message: string) => {
  const event = new CustomEvent('showSuccessToast', {
    detail: { message }
  });
  window.dispatchEvent(event);
};

export const showErrorToast = (message: string, errorType?: ErrorType, severity?: ErrorSeverity) => {
  const event = new CustomEvent('showErrorToast', {
    detail: { message, type: errorType, severity }
  });
  window.dispatchEvent(event);
};

export const showToast = (toast: Partial<ToastMessage>) => {
  const event = new CustomEvent('showToast', {
    detail: toast
  });
  window.dispatchEvent(event);
};