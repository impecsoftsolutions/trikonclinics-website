import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Eye, Calendar, User, Hash, Check } from 'lucide-react';
import type { ActiveThemeInfo } from '../types/modernTheme';
import { loadActiveTheme } from '../lib/modernThemeService';
import { ColorSwatch } from '../components/modern-themes/ColorSwatch';

interface Message {
  type: 'success' | 'error';
  text: string;
}

export const ModernThemeSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState<ActiveThemeInfo | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = async () => {
    console.log('[Modern Themes]', 'Loading active theme data');
    setLoading(true);

    try {
      const activeResult = await loadActiveTheme();

      if (activeResult.error) {
        console.error('[Modern Themes]', 'Error loading active theme:', activeResult.error);
        setMessage({ type: 'error', text: activeResult.error });
      } else {
        setActiveTheme(activeResult.data);
        console.log('[Modern Themes]', 'Active theme:', activeResult.data?.name || 'None');
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load theme. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  if (!activeTheme) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Modern Themes</h1>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Theme</h3>
            <p className="text-gray-600">Contact your administrator to activate a theme.</p>
          </div>
        </div>
      </div>
    );
  }

  const config = activeTheme.config;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Modern Themes</h1>
          </div>
          <p className="text-gray-600">View current theme configuration and settings.</p>
        </div>

        <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 font-medium">
            Theme settings are currently view-only. Contact your administrator to make changes.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{activeTheme.name}</h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  <Check className="w-4 h-4" />
                  Active Theme
                </span>
              </div>
              <p className="text-gray-600">{activeTheme.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Activated On</p>
                <p className="text-sm text-gray-900">{formatDate(activeTheme.activated_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Last Updated</p>
                <p className="text-sm text-gray-900">{formatDate(activeTheme.updated_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Type</p>
                <p className="text-sm text-gray-900">{activeTheme.is_preset ? 'Preset Theme' : 'Custom Theme'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Validation</p>
                <p className="text-sm text-gray-900 capitalize">{activeTheme.validation_status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Palette</h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Primary Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch color={config.colors.primary} label="Primary" size="lg" />
                  <ColorSwatch color={config.colors.secondary} label="Secondary" size="lg" />
                  <ColorSwatch color={config.colors.accent} label="Accent" size="lg" />
                  {config.colors.decorativeIcon && (
                    <ColorSwatch color={config.colors.decorativeIcon} label="Decorative Icon" size="lg" />
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Background Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch color={config.colors.background.page} label="Page" size="lg" />
                  <ColorSwatch color={config.colors.background.surface} label="Surface" size="lg" />
                  <ColorSwatch color={config.colors.background.elevated} label="Elevated" size="lg" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Text Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch color={config.colors.text.primary} label="Primary Text" size="lg" />
                  <ColorSwatch color={config.colors.text.secondary} label="Secondary Text" size="lg" />
                  <ColorSwatch color={config.colors.text.muted} label="Muted Text" size="lg" />
                  <ColorSwatch color={config.colors.text.inverse} label="Inverse Text" size="lg" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Semantic Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch color={config.colors.semantic.success} label="Success" size="lg" />
                  <ColorSwatch color={config.colors.semantic.warning} label="Warning" size="lg" />
                  <ColorSwatch color={config.colors.semantic.error} label="Error" size="lg" />
                  <ColorSwatch color={config.colors.semantic.info} label="Info" size="lg" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Border Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch color={config.colors.border.default} label="Default" size="lg" />
                  <ColorSwatch color={config.colors.border.hover} label="Hover" size="lg" />
                  <ColorSwatch color={config.colors.border.focus} label="Focus" size="lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Heading Font</p>
                  <p className="text-sm text-gray-900 font-medium">{config.typography.fontFamilies.heading}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Body Font</p>
                  <p className="text-sm text-gray-900">{config.typography.fontFamilies.body}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Mono Font</p>
                  <p className="text-sm text-gray-900 font-mono">{config.typography.fontFamilies.mono}</p>
                </div>
              </div>

              {config.layoutTypography && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-3">Heading Sizes</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">H1</p>
                      <p className="text-sm text-gray-900">{config.layoutTypography.headingSizes.h1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">H2</p>
                      <p className="text-sm text-gray-900">{config.layoutTypography.headingSizes.h2}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">H3</p>
                      <p className="text-sm text-gray-900">{config.layoutTypography.headingSizes.h3}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout Configuration</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Layout Style</p>
                  <p className="text-sm text-gray-900 capitalize">{config.layoutStyle || 'Modern'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Navigation Style</p>
                  <p className="text-sm text-gray-900 capitalize">{config.layouts.navigation.style}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Hero Layout</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Layout</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.hero.layout}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Image Position</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.hero.imagePosition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Text Align</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.hero.textAlign}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Page Layouts</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Doctors</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.pages.doctors.layout}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Services</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.pages.services.layout}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Testimonials</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.pages.testimonials.layout}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.pages.contact.layout}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Card Settings</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Border Radius</p>
                    <p className="text-sm text-gray-900">{config.layouts.cards.radius}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shadow</p>
                    <p className="text-sm text-gray-900">{config.layouts.cards.shadow}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Padding</p>
                    <p className="text-sm text-gray-900">{config.layouts.cards.padding}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hover Effect</p>
                    <p className="text-sm text-gray-900 capitalize">{config.layouts.cards.hoverEffect}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Tokens</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Border Radius</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(config.designTokens.borderRadius).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Shadows</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(config.designTokens.shadows).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm text-gray-900 font-mono text-xs">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {config.layoutSpacing && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-3">Spacing</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Section Padding</p>
                      <p className="text-sm text-gray-900">{config.layoutSpacing.sectionPaddingY}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Card Padding</p>
                      <p className="text-sm text-gray-900">{config.layoutSpacing.cardPadding}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Element Gap</p>
                      <p className="text-sm text-gray-900">{config.layoutSpacing.elementGap}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(config.emergencyButton || config.backButton) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Configurations</h3>

              <div className="space-y-4">
                {config.emergencyButton && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-3">Emergency Button</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {config.emergencyButton.text && (
                        <div>
                          <p className="text-xs text-gray-500">Text</p>
                          <p className="text-sm text-gray-900">{config.emergencyButton.text}</p>
                        </div>
                      )}
                      {config.emergencyButton.backgroundColor && (
                        <div>
                          <p className="text-xs text-gray-500">Background Color</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: config.emergencyButton.backgroundColor }}
                            />
                            <p className="text-sm text-gray-900">{config.emergencyButton.backgroundColor}</p>
                          </div>
                        </div>
                      )}
                      {config.emergencyButton.textColor && (
                        <div>
                          <p className="text-xs text-gray-500">Text Color</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: config.emergencyButton.textColor }}
                            />
                            <p className="text-sm text-gray-900">{config.emergencyButton.textColor}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {config.backButton && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-3">Back Button</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {config.backButton.text && (
                        <div>
                          <p className="text-xs text-gray-500">Text</p>
                          <p className="text-sm text-gray-900">{config.backButton.text}</p>
                        </div>
                      )}
                      {config.backButton.backgroundColor && (
                        <div>
                          <p className="text-xs text-gray-500">Background Color</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: config.backButton.backgroundColor }}
                            />
                            <p className="text-sm text-gray-900">{config.backButton.backgroundColor}</p>
                          </div>
                        </div>
                      )}
                      {config.backButton.textColor && (
                        <div>
                          <p className="text-xs text-gray-500">Text Color</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: config.backButton.textColor }}
                            />
                            <p className="text-sm text-gray-900">{config.backButton.textColor}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Animations & Accessibility</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Animation Features</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.animations.features.scrollReveal}
                      disabled
                      className="rounded"
                    />
                    <p className="text-sm text-gray-900">Scroll Reveal</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.animations.features.hoverEffects}
                      disabled
                      className="rounded"
                    />
                    <p className="text-sm text-gray-900">Hover Effects</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.animations.features.pageTransitions}
                      disabled
                      className="rounded"
                    />
                    <p className="text-sm text-gray-900">Page Transitions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.animations.features.reduceMotionRespect}
                      disabled
                      className="rounded"
                    />
                    <p className="text-sm text-gray-900">Respect Reduced Motion</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-3">Accessibility</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">High Contrast</p>
                    <p className="text-sm text-gray-900">{config.accessibility.highContrast.enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Focus Style</p>
                    <p className="text-sm text-gray-900 capitalize">{config.accessibility.focusIndicators.style}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Keyboard Navigation</p>
                    <p className="text-sm text-gray-900">{config.accessibility.keyboardNavigation.skipLinks ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Screen Reader</p>
                    <p className="text-sm text-gray-900">{config.accessibility.screenReader.announcements ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
