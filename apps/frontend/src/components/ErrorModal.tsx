import { Modal } from "./Modal";
import type { ImportError } from "@repo/types";

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string[];
  message?: string;
  existingSpellId?: string;
  [key: string]: any;
}

export interface ApiErrorInfo {
  message: string;
  code?: string;
  details?: ErrorDetails;
  status?: number;
}

export interface ImportErrorInfo extends ApiErrorInfo {
  importedCount?: number;
  totalAttempted?: number;
  errorCount?: number;
  errors?: ImportError[];
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ApiErrorInfo | ImportErrorInfo;
  title?: string;
}

export function ErrorModal({ isOpen, onClose, error, title }: ErrorModalProps) {
  const isImportError = 'errors' in error && Array.isArray(error.errors);
  const modalTitle = title || (isImportError ? 'Import Results' : 'Error');

  const getErrorIcon = (code?: string) => {
    switch (code) {
      case 'UNIQUE_CONSTRAINT_VIOLATION':
      case 'CONFLICT_ERROR':
        return '⚠️';
      case 'NOT_FOUND_ERROR':
        return '🔍';
      case 'VALIDATION_ERROR':
        return '📝';
      default:
        return '❌';
    }
  };

  const getErrorColor = (code?: string) => {
    switch (code) {
      case 'UNIQUE_CONSTRAINT_VIOLATION':
      case 'CONFLICT_ERROR':
        return 'text-yellow-400';
      case 'NOT_FOUND_ERROR':
        return 'text-blue-400';
      case 'VALIDATION_ERROR':
        return 'text-orange-400';
      default:
        return 'text-red-400';
    }
  };

  const renderSingleError = (errorInfo: ApiErrorInfo) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <span className="text-3xl">{getErrorIcon(errorInfo.code)}</span>
        <div>
          <h3 className={`text-lg font-semibold ${getErrorColor(errorInfo.code)}`}>
            {errorInfo.message}
          </h3>
          {errorInfo.code && (
            <p className="text-sm text-gray-400">Error Code: {errorInfo.code}</p>
          )}
        </div>
      </div>

      {errorInfo.details && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Details:</h4>
          
          {errorInfo.details.field && (
            <div className="text-sm">
              <span className="text-gray-400">Field: </span>
              <span className="text-white font-mono">{errorInfo.details.field}</span>
            </div>
          )}
          
          {errorInfo.details.value && (
            <div className="text-sm">
              <span className="text-gray-400">Value: </span>
              <span className="text-white font-mono">"{errorInfo.details.value}"</span>
            </div>
          )}
          
          {errorInfo.details.message && (
            <div className="text-sm">
              <span className="text-gray-400">Message: </span>
              <span className="text-gray-200">{errorInfo.details.message}</span>
            </div>
          )}

          {errorInfo.details.existingSpellId && (
            <div className="text-sm">
              <span className="text-gray-400">Existing Spell ID: </span>
              <span className="text-white font-mono text-xs">{errorInfo.details.existingSpellId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderImportError = (importError: ImportErrorInfo) => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Import Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Total Attempted:</span>
            <div className="text-white font-semibold">{importError.totalAttempted || 0}</div>
          </div>
          <div>
            <span className="text-green-400">Successfully Imported:</span>
            <div className="text-green-400 font-semibold">{importError.importedCount || 0}</div>
          </div>
          <div>
            <span className="text-red-400">Failed:</span>
            <div className="text-red-400 font-semibold">{importError.errorCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Main message */}
      <div className="flex items-center space-x-3">
        <span className="text-3xl">
          {importError.importedCount === 0 ? '❌' : importError.errorCount === 0 ? '✅' : '⚠️'}
        </span>
        <div>
          <h3 className={`text-lg font-semibold ${
            importError.importedCount === 0 ? 'text-red-400' : 
            importError.errorCount === 0 ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {importError.message}
          </h3>
        </div>
      </div>

      {/* Error details */}
      {importError.errors && importError.errors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Failed Spells:</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {importError.errors.map((err, index) => (
              <div key={index} className="bg-gray-700 rounded p-3 text-sm">
                <div className="font-medium text-white mb-1">
                  {err.item?.name || `Item ${index + 1}`}
                </div>
                <div className="text-red-400">{err.error}</div>
                {err.item?.convocation && (
                  <div className="text-gray-400 text-xs mt-1">
                    {err.item.convocation} • Level {err.item.complexityLevel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-6">
        {isImportError ? renderImportError(error as ImportErrorInfo) : renderSingleError(error)}
        
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
