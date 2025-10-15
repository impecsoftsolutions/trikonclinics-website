import React, { useState, useEffect } from 'react';
import { Check, Clock, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActiveThemeInfo } from '../../types/modernTheme';
import { ColorSwatch } from './ColorSwatch';
import { calculateTimeRemaining, formatTimeRemaining } from '../../utils/timeRemaining';

interface ActiveThemeHeaderProps {
  activeTheme: ActiveThemeInfo | null;
  canManage: boolean;
  onRollback: () => void;
}

export const ActiveThemeHeader: React.FC<ActiveThemeHeaderProps> = ({
  activeTheme,
  canManage,
  onRollback,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(activeTheme?.rollback_deadline || null));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(activeTheme?.rollback_deadline || null));
    }, 60000);

    return () => clearInterval(interval);
  }, [activeTheme?.rollback_deadline]);

  if (!activeTheme) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm font-medium">
          No active theme found. Please activate a theme to customize your website appearance.
        </p>
      </div>
    );
  }

  const canRollback = activeTheme.previous_theme_id && !timeRemaining.expired;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Currently Active Theme</h3>
              <p className="text-sm text-gray-600">This theme is currently applied to your website</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-gray-500 mb-1">Theme Name</p>
              <p className="text-base font-semibold text-gray-900">{activeTheme.name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Color Palette</p>
              <div className="flex gap-2">
                <ColorSwatch color={activeTheme.config.colors.primary} size="sm" />
                <ColorSwatch color={activeTheme.config.colors.secondary} size="sm" />
                <ColorSwatch color={activeTheme.config.colors.accent} size="sm" />
              </div>
            </div>

            {activeTheme.activated_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Activated</p>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(activeTheme.activated_at), { addSuffix: true })}
                </p>
              </div>
            )}

            {canRollback && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Rollback Available</p>
                <p className="text-sm font-medium text-orange-600">
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            )}
          </div>
        </div>

        {canManage && canRollback && (
          <div>
            <button
              onClick={onRollback}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Emergency Rollback
            </button>
            <p className="text-xs text-gray-600 mt-2 text-right">
              Restore previous theme
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
