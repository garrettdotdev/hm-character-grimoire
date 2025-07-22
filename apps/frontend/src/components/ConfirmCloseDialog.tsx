interface ConfirmCloseDialogProps {
  isOpen: boolean;
  onDiscard: () => void;
  onGoBack: () => void;
  onSaveAndClose?: () => void;
  title?: string;
  message?: string;
  canSave?: boolean;
}

export function ConfirmCloseDialog({
  isOpen,
  onDiscard,
  onGoBack,
  onSaveAndClose,
  title = "Unsaved Changes",
  message = "You have unsaved changes that will be lost if you close this dialog.",
  canSave = false,
}: ConfirmCloseDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-600">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-3">
            {/* Warning Icon */}
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="flex-1">
              <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
              <p className="text-gray-400 text-xs mt-2">
                What would you like to do?
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onGoBack}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            Go Back
          </button>
          {canSave && onSaveAndClose && (
            <button
              onClick={onSaveAndClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Save and Close
            </button>
          )}
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}
