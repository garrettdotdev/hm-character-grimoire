import { useState, useCallback } from 'react';
import { ApiError } from '../services/api';
import type { ApiErrorInfo, ImportErrorInfo } from '../components/ErrorModal';

export function useErrorHandler() {
  const [errorInfo, setErrorInfo] = useState<ApiErrorInfo | ImportErrorInfo | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error('Error occurred:', error, context ? `Context: ${context}` : '');

    let errorInfo: ApiErrorInfo;

    if (error instanceof ApiError) {
      // Extract enhanced error information from the API response
      const response = error.response;
      
      errorInfo = {
        message: error.message,
        status: error.status,
        code: response?.code,
        details: response?.details,
      };

      // Handle import-specific errors
      if (response?.errors && Array.isArray(response.errors)) {
        const importErrorInfo: ImportErrorInfo = {
          ...errorInfo,
          importedCount: response.importedCount,
          totalAttempted: response.totalAttempted,
          errorCount: response.errorCount,
          errors: response.errors,
        };
        setErrorInfo(importErrorInfo);
      } else {
        setErrorInfo(errorInfo);
      }
    } else if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
      setErrorInfo(errorInfo);
    } else {
      errorInfo = {
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
      };
      setErrorInfo(errorInfo);
    }

    setShowErrorModal(true);
  }, []);

  const handleApiError = useCallback((error: ApiError, context?: string) => {
    handleError(error, context);
  }, [handleError]);

  const clearError = useCallback(() => {
    setErrorInfo(null);
    setShowErrorModal(false);
  }, []);

  const showError = useCallback((message: string, code?: string, details?: any) => {
    const errorInfo: ApiErrorInfo = {
      message,
      code,
      details,
    };
    setErrorInfo(errorInfo);
    setShowErrorModal(true);
  }, []);

  return {
    errorInfo,
    showErrorModal,
    handleError,
    handleApiError,
    clearError,
    showError,
  };
}

// Utility function to extract user-friendly error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Utility function to check if an error is a conflict error
export function isConflictError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 409 || error.response?.code === 'UNIQUE_CONSTRAINT_VIOLATION' || error.response?.code === 'CONFLICT_ERROR';
  }
  return false;
}

// Utility function to check if an error is a validation error
export function isValidationError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 400 || error.response?.code === 'VALIDATION_ERROR';
  }
  return false;
}

// Utility function to check if an error is a not found error
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404 || error.response?.code === 'NOT_FOUND_ERROR';
  }
  return false;
}
