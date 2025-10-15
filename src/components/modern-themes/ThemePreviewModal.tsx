import React from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { ModernTheme } from '../../types/modernTheme';
import { ColorSwatch } from './ColorSwatch';

interface ThemePreviewModalProps {
  isOpen: boolean;
  theme: ModernTheme | null;
  canManage: boolean;
  isActive: boolean;
  onClose: () => void;
  onActivate?: (themeId: string) => void;
}

export const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({
  isOpen,
  theme,
  canManage,
  isActive,
  onClose,
  onActivate,
}) => {
  if (!isOpen || !theme) return null;

  const renderColorSection = (title: string, colors: any) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">Primary</p>
          <ColorSwatch color={colors.primary} size="lg" showLabel={false} />
          <p className="text-xs text-gray-600 mt-1 font-mono">{colors.primary}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Secondary</p>
          <ColorSwatch color={colors.secondary} size="lg" showLabel={false} />
          <p className="text-xs text-gray-600 mt-1 font-mono">{colors.secondary}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Accent</p>
          <ColorSwatch color={colors.accent} size="lg" showLabel={false} />
          <p className="text-xs text-gray-600 mt-1 font-mono">{colors.accent}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Background (Page)</p>
          <ColorSwatch color={colors.background.page} size="lg" showLabel={false} />
          <p className="text-xs text-gray-600 mt-1 font-mono">{colors.background.page}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Text (Primary)</p>
          <ColorSwatch color={colors.text.primary} size="lg" showLabel={false} />
          <p className="text-xs text-gray-600 mt-1 font-mono">{colors.text.primary}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Border (Focus)</p>
          <ColorSwatch color={colors.border.focus} size="lg" showLabel={false} />
          <p className="text-xs text-gray-600 mt-1 font-mono">{colors.border.focus}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-lg p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{theme.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
              <div className="flex gap-2 mt-2">
                {theme.is_preset && (
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    Preset Theme
                  </span>
                )}
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    <Check className="w-3 h-3" />
                    Currently Active
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-240px)] overflow-y-auto">
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Slug:</span>
                  <span className="ml-2 font-mono text-gray-900">{theme.slug}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(theme.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`ml-2 font-medium ${
                      theme.validation_status === 'passed'
                        ? 'text-green-600'
                        : theme.validation_status === 'failed'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {theme.validation_status.charAt(0).toUpperCase() +
                      theme.validation_status.slice(1)}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Colors
              </h3>
              {renderColorSection('Color Palette', theme.config.colors)}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Typography
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Heading Font</p>
                  <p className="text-gray-900 font-medium">{theme.config.typography.fontFamilies.heading}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Body Font</p>
                  <p className="text-gray-900 font-medium">{theme.config.typography.fontFamilies.body}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Font Sizes</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(theme.config.typography.fontSizes).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Font Weights</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(theme.config.typography.fontWeights).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Design Tokens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-2">Border Radius</p>
                  <div className="space-y-1">
                    {Object.entries(theme.config.designTokens.borderRadius).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}</span>
                        <span className="font-mono text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 mb-2">Shadows</p>
                  <div className="space-y-1">
                    {Object.entries(theme.config.designTokens.shadows).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}</span>
                        <span className="font-mono text-xs text-gray-900 truncate ml-2">{String(value).substring(0, 30)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Layouts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-2">Navigation</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Style</span>
                      <span className="text-gray-900 capitalize">{theme.config.layouts.navigation.style}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position</span>
                      <span className="text-gray-900 capitalize">{theme.config.layouts.navigation.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transparent</span>
                      <span className="text-gray-900">{theme.config.layouts.navigation.transparent ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 mb-2">Cards</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Radius</span>
                      <span className="text-gray-900 font-mono">{theme.config.layouts.cards.radius}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shadow</span>
                      <span className="text-gray-900">{theme.config.layouts.cards.shadow}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hover Effect</span>
                      <span className="text-gray-900 capitalize">{theme.config.layouts.cards.hoverEffect}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Animations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-2">Durations</p>
                  <div className="space-y-1">
                    {Object.entries(theme.config.animations.durations).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className="text-gray-900 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 mb-2">Features</p>
                  <div className="space-y-1">
                    {Object.entries(theme.config.animations.features).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-900">{value ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Accessibility
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-2">Focus Indicators</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Style</span>
                      <span className="text-gray-900 capitalize">{theme.config.accessibility.focusIndicators.style}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Width</span>
                      <span className="text-gray-900 font-mono">{theme.config.accessibility.focusIndicators.width}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color</span>
                      <span className="text-gray-900 font-mono">{theme.config.accessibility.focusIndicators.color}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 mb-2">Other Settings</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reduced Motion</span>
                      <span className="text-gray-900">{theme.config.accessibility.reducedMotion.respectPreference ? 'Respected' : 'Ignored'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skip Links</span>
                      <span className="text-gray-900">{theme.config.accessibility.keyboardNavigation.skipLinks ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Target Size</span>
                      <span className="text-gray-900 font-mono">{theme.config.accessibility.minimumTargetSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 rounded-b-lg p-6">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              Close
            </button>
            {canManage && onActivate && !isActive && (
              <button
                onClick={() => onActivate(theme.id)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Activate This Theme
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
