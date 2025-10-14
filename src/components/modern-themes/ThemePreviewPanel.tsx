import React from 'react';
import { Sun, Moon, User, Heart, Stethoscope } from 'lucide-react';
import type { ThemeConfig } from '../../types/modernTheme';

interface ThemePreviewPanelProps {
  config: ThemeConfig;
  mode: 'light' | 'dark';
  onModeToggle: () => void;
}

export const ThemePreviewPanel: React.FC<ThemePreviewPanelProps> = ({
  config,
  mode,
  onModeToggle,
}) => {
  const colors = mode === 'light' ? config.colors.light : config.colors.dark;
  const typography = config.typography;
  const layouts = config.layouts;
  const tokens = config.designTokens;

  return (
    <div className="sticky top-6 h-fit">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
          <button
            onClick={onModeToggle}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            {mode === 'light' ? (
              <>
                <Sun className="w-4 h-4" />
                Light
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                Dark
              </>
            )}
          </button>
        </div>

        <div
          className="p-6 space-y-6 overflow-y-auto"
          style={{
            backgroundColor: colors.background.page,
            color: colors.text.primary,
            fontFamily: typography.fontFamilies.body,
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
          <div
            className="p-4 rounded-lg shadow-sm"
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: tokens.borderRadius.lg,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Stethoscope className="w-5 h-5" style={{ color: colors.text.inverse }} />
              </div>
              <div>
                <h4
                  className="font-semibold"
                  style={{
                    fontFamily: typography.fontFamilies.heading,
                    fontSize: typography.fontSizes.lg,
                    color: colors.text.primary,
                  }}
                >
                  Navigation Bar
                </h4>
                <p
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  {layouts.navigation.style} style
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: colors.background.elevated,
              borderRadius: tokens.borderRadius.xl,
              boxShadow: tokens.shadows.md,
            }}
          >
            <h2
              className="font-bold mb-2"
              style={{
                fontFamily: typography.fontFamilies.heading,
                fontSize: typography.fontSizes['2xl'],
                color: colors.text.primary,
              }}
            >
              Hero Section
            </h2>
            <p
              className="mb-4"
              style={{
                fontSize: typography.fontSizes.base,
                color: colors.text.secondary,
                lineHeight: typography.lineHeights.relaxed,
              }}
            >
              Welcome to our healthcare facility. We provide excellent care with modern technology.
            </p>
            <button
              className="px-6 py-2.5 font-medium rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: colors.text.inverse,
                borderRadius: tokens.borderRadius.md,
                fontSize: typography.fontSizes.base,
              }}
            >
              Get Started
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.background.surface,
                borderRadius: layouts.cards.radius,
                boxShadow: tokens.shadows[layouts.cards.shadow as keyof typeof tokens.shadows] || tokens.shadows.md,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: colors.secondary }}
              >
                <User className="w-4 h-4" style={{ color: colors.text.inverse }} />
              </div>
              <h3
                className="font-semibold mb-1"
                style={{
                  fontFamily: typography.fontFamilies.heading,
                  fontSize: typography.fontSizes.base,
                  color: colors.text.primary,
                }}
              >
                Doctors
              </h3>
              <p
                className="text-sm"
                style={{ color: colors.text.muted }}
              >
                Expert physicians
              </p>
            </div>

            <div
              className="p-4 rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.background.surface,
                borderRadius: layouts.cards.radius,
                boxShadow: tokens.shadows[layouts.cards.shadow as keyof typeof tokens.shadows] || tokens.shadows.md,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: colors.accent }}
              >
                <Heart className="w-4 h-4" style={{ color: colors.text.inverse }} />
              </div>
              <h3
                className="font-semibold mb-1"
                style={{
                  fontFamily: typography.fontFamilies.heading,
                  fontSize: typography.fontSizes.base,
                  color: colors.text.primary,
                }}
              >
                Services
              </h3>
              <p
                className="text-sm"
                style={{ color: colors.text.muted }}
              >
                Quality healthcare
              </p>
            </div>
          </div>

          <div
            className="p-4 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: colors.semantic.success + '20',
              border: `2px solid ${colors.semantic.success}`,
              borderRadius: tokens.borderRadius.lg,
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colors.semantic.success }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke={colors.text.inverse}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p
                className="font-medium"
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: colors.text.primary,
                }}
              >
                Success Message
              </p>
              <p
                className="text-xs"
                style={{ color: colors.text.secondary }}
              >
                Operation completed successfully
              </p>
            </div>
          </div>

          <div
            className="flex gap-2 flex-wrap"
            style={{ fontSize: typography.fontSizes.xs }}
          >
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: colors.border.default,
                color: colors.text.secondary,
              }}
            >
              Tag 1
            </span>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: colors.border.default,
                color: colors.text.secondary,
              }}
            >
              Tag 2
            </span>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: colors.border.default,
                color: colors.text.secondary,
              }}
            >
              Tag 3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
