import React, { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';
import { slugify } from '../../utils/slugify';

interface DuplicateThemeModalProps {
  isOpen: boolean;
  originalName: string;
  onConfirm: (newName: string, newSlug: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DuplicateThemeModal: React.FC<DuplicateThemeModalProps> = ({
  isOpen,
  originalName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [newName, setNewName] = useState(`${originalName} Copy`);
  const [newSlug, setNewSlug] = useState('');

  useEffect(() => {
    if (isOpen) {
      const defaultName = `${originalName} Copy`;
      setNewName(defaultName);
      setNewSlug(slugify(defaultName));
    }
  }, [isOpen, originalName]);

  useEffect(() => {
    setNewSlug(slugify(newName));
  }, [newName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newSlug.trim()) {
      onConfirm(newName.trim(), newSlug.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Copy className="w-5 h-5 text-blue-600" />
              Duplicate Theme
            </h2>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="theme-name" className="block text-sm font-medium text-gray-700 mb-2">
                New Theme Name
              </label>
              <input
                type="text"
                id="theme-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter theme name"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Slug
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
                {newSlug || 'theme-slug'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This URL-safe identifier is automatically generated from the theme name.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !newName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Duplicate Theme
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
