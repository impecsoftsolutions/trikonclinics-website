import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {confirmVariant === 'danger' && (
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmButtonClass}`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
