import type { ColorPalette } from '../types/modernTheme';

export function getContrastColor(bgColor: string): 'light' | 'dark' {
  const color = bgColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'dark' : 'light';
}

export function ensureContrast(textColor: string, bgColor: string, minRatio: number = 4.5): string {
  const textLum = calculateLuminance(textColor);
  const bgLum = calculateLuminance(bgColor);

  const ratio = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);

  if (ratio >= minRatio) {
    return textColor;
  }

  return getContrastColor(bgColor) === 'light' ? '#FFFFFF' : '#000000';
}

function calculateLuminance(color: string): number {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

export function createGradientString(
  type: 'linear' | 'radial',
  angle: number,
  stops: Array<{ color: string; position: number }>
): string {
  const stopsString = stops
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');

  if (type === 'linear') {
    return `linear-gradient(${angle}deg, ${stopsString})`;
  } else {
    return `radial-gradient(circle, ${stopsString})`;
  }
}

export function getThemedShadow(size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): string {
  return `var(--shadow-${size}, 0 4px 6px rgba(0,0,0,0.1))`;
}

export function getThemedBorderRadius(size: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'): string {
  return `var(--radius-${size}, 8px)`;
}

export function getThemedSpacing(size: string): string {
  return `var(--spacing-${size}, 16px)`;
}

export function createThemedStyle(colors: ColorPalette) {
  return {
    card: {
      backgroundColor: `hsl(var(--color-bg-surface))`,
      borderRadius: getThemedBorderRadius('lg'),
      boxShadow: getThemedShadow('md'),
      padding: getThemedSpacing('6'),
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: `hsl(var(--color-border-default))`,
    },
    button: {
      primary: {
        backgroundColor: colors.primary,
        color: `hsl(var(--color-text-inverse))`,
        padding: `${getThemedSpacing('3')} ${getThemedSpacing('6')}`,
        borderRadius: getThemedBorderRadius('md'),
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
      },
      secondary: {
        backgroundColor: `hsl(var(--color-bg-surface))`,
        color: colors.primary,
        padding: `${getThemedSpacing('3')} ${getThemedSpacing('6')}`,
        borderRadius: getThemedBorderRadius('md'),
        fontWeight: '600',
        border: `2px solid ${colors.primary}`,
        cursor: 'pointer',
      },
    },
    section: {
      paddingTop: getThemedSpacing('20'),
      paddingBottom: getThemedSpacing('20'),
      backgroundColor: `hsl(var(--color-bg-page))`,
    },
    sectionElevated: {
      paddingTop: getThemedSpacing('20'),
      paddingBottom: getThemedSpacing('20'),
      backgroundColor: `hsl(var(--color-bg-elevated))`,
    },
    text: {
      primary: {
        color: `hsl(var(--color-text-primary))`,
      },
      secondary: {
        color: `hsl(var(--color-text-secondary))`,
      },
      muted: {
        color: `hsl(var(--color-text-muted))`,
      },
      inverse: {
        color: `hsl(var(--color-text-inverse))`,
      },
    },
  };
}

export function withThemedProps<T extends Record<string, any>>(
  baseProps: T,
  themedOverrides: Partial<T>
): T {
  return {
    ...baseProps,
    style: {
      ...baseProps.style,
      ...themedOverrides.style,
    },
  };
}

export function createIconBoxStyle(colorHex: string, alpha: number = 0.1): React.CSSProperties {
  return {
    backgroundColor: `${colorHex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
    color: colorHex,
    width: getThemedSpacing('12'),
    height: getThemedSpacing('12'),
    borderRadius: getThemedBorderRadius('md'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

export function createBadgeStyle(colorHex: string, alpha: number = 0.1): React.CSSProperties {
  return {
    backgroundColor: `${colorHex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
    color: colorHex,
    display: 'inline-block',
    padding: `${getThemedSpacing('2')} ${getThemedSpacing('4')}`,
    borderRadius: getThemedBorderRadius('full'),
    fontSize: 'var(--font-size-sm, 0.875rem)',
    fontWeight: '600',
  };
}

export function applyTransition(
  element: 'all' | 'colors' | 'transform' | 'opacity',
  duration: 'fast' | 'normal' | 'slow' = 'normal'
): string {
  const durationMap = {
    fast: 'var(--duration-fast, 150ms)',
    normal: 'var(--duration-normal, 300ms)',
    slow: 'var(--duration-slow, 500ms)',
  };

  const elementMap = {
    all: 'all',
    colors: 'background-color, color, border-color',
    transform: 'transform',
    opacity: 'opacity',
  };

  return `${elementMap[element]} ${durationMap[duration]} var(--easing-default, ease)`;
}
