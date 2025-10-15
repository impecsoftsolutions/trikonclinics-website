import React from 'react';
import { Eye, Copy, Trash2, Check, Award, Edit2 } from 'lucide-react';
import type { ModernTheme } from '../../types/modernTheme';
import { ColorSwatch } from './ColorSwatch';

interface ThemeCardProps {
  theme: ModernTheme;
  isActive: boolean;
  canManage: boolean;
  isSuperAdmin: boolean;
  onActivate: (themeId: string) => void;
  onViewDetails: (theme: ModernTheme) => void;
  onEdit: (theme: ModernTheme) => void;
  onDuplicate: (theme: ModernTheme) => void;
  onDelete: (theme: ModernTheme) => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive,
  canManage,
  isSuperAdmin,
  onActivate,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col h-full ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">{theme.name}</h3>
        <div className="flex gap-2 ml-2">
          {theme.is_preset && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
              <Award className="w-3 h-3" />
              Preset
            </span>
          )}
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
              <Check className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 flex-1">
        {truncateDescription(theme.description)}
      </p>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2 font-medium">Color Palette</p>
        <div className="flex gap-2">
          <ColorSwatch
            color={theme.config.colors.primary}
            label="Primary"
            size="md"
          />
          <ColorSwatch
            color={theme.config.colors.secondary}
            label="Secondary"
            size="md"
          />
          <ColorSwatch
            color={theme.config.colors.accent}
            label="Accent"
            size="md"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        {canManage && (
          <button
            onClick={() => onActivate(theme.id)}
            disabled={isActive}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            {isActive ? 'Active' : 'Activate'}
          </button>
        )}
        <button
          onClick={() => onViewDetails(theme)}
          className={`${
            canManage ? 'flex-1' : 'flex-1'
          } px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1`}
        >
          <Eye className="w-4 h-4" />
          Details
        </button>
      </div>

      {canManage && (
        <div className="space-y-2 mt-2">
          {isSuperAdmin && (
            <button
              onClick={() => onEdit(theme)}
              disabled={theme.is_preset}
              title={theme.is_preset ? 'Preset themes cannot be edited. Duplicate this theme to create an editable version.' : 'Edit theme configuration'}
              className="w-full px-3 py-2 border border-blue-300 hover:bg-blue-50 text-blue-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-white"
            >
              <Edit2 className="w-4 h-4" />
              Edit Theme
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onDuplicate(theme)}
              className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            {!theme.is_preset && (
              <button
                onClick={() => onDelete(theme)}
                className="flex-1 px-3 py-2 border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
