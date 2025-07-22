import { type ReactNode, useEffect, useState } from "react";
import { ConfirmCloseDialog } from "./ConfirmCloseDialog";

interface ProtectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  isDirty?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
}

export function ProtectedModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  isDirty = false,
  confirmTitle,
  confirmMessage,
}: ProtectedModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleCloseAttempt();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isDirty]);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  const handleBackdropClick = () => {
    handleCloseAttempt();
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={handleBackdropClick} />

        {/* Modal */}
        <div
          className={`relative bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <div className="flex items-center gap-2">
              {/* Dirty indicator */}
              {isDirty && (
                <div
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  title="Unsaved changes"
                />
              )}
              {/* Close button */}
              <button
                onClick={handleCloseAttempt}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmCloseDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title={confirmTitle}
        message={confirmMessage}
      />
    </>
  );
}
