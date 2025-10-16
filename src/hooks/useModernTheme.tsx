import { useModernThemeContext } from '../contexts/ModernThemeContext';
import type { ColorPalette } from '../types/modernTheme';

export function useModernTheme() {
  const context = useModernThemeContext();

  const getCurrentColors = (): ColorPalette => {
    return context.theme.colors;
  };

  const getGradient = (gradientName: string): string => {
    const gradient = context.theme.gradients?.find((g) => g.name === gradientName);
    if (!gradient) return 'none';

    const stops = gradient.stops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (gradient.type === 'linear') {
      return `linear-gradient(${gradient.angle || 135}deg, ${stops})`;
    } else if (gradient.type === 'radial') {
      return `radial-gradient(circle, ${stops})`;
    }

    return 'none';
  };

  const colors = getCurrentColors();

  return {
    theme: context.theme,
    themeName: context.themeName,
    loading: context.loading,
    error: context.error,
    colors,
    getGradient,
    layoutStyle: context.layoutStyle,
    layoutTypography: context.layoutTypography,
    layoutSpacing: context.layoutSpacing,
    emergencyButton: context.theme.emergencyButton || {
      text: 'Emergency Call',
      backgroundColor: '#EF4444',
      textColor: '#FFFFFF'
    },
    backButton: context.theme.backButton || {
      text: 'Back',
      backgroundColor: 'transparent',
      textColor: '',
      borderColor: '',
      hoverBackgroundColor: '',
      hoverTextColor: '',
    },
    primaryCtaButton: context.theme.primaryCtaButton || {
      text: 'Get Started',
      backgroundColor: '#CC0000',
      textColor: '#FFFFFF',
      hoverOpacity: 0.9,
    },
    navigationActiveBackground: context.theme.layouts?.navigation?.activeBackground,
    decorativeIconColor: colors?.decorativeIcon || '#FBBF24',
    healthLibraryEnabled: context.healthLibraryEnabled,
  };
}
