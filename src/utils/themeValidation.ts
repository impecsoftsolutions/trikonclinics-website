import type { ThemeConfig } from '../types/modernTheme';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateThemeConfig(config: ThemeConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.colors?.light?.primary || !isValidHexColor(config.colors.light.primary)) {
    errors.push({
      field: 'colors.light.primary',
      message: 'Light mode primary color must be a valid hex color',
      severity: 'error',
    });
  }

  if (!config.colors?.dark?.primary || !isValidHexColor(config.colors.dark.primary)) {
    errors.push({
      field: 'colors.dark.primary',
      message: 'Dark mode primary color must be a valid hex color',
      severity: 'error',
    });
  }

  if (!config.typography?.fontFamilies?.heading) {
    errors.push({
      field: 'typography.fontFamilies.heading',
      message: 'Heading font family is required',
      severity: 'error',
    });
  }

  if (!config.typography?.fontFamilies?.body) {
    errors.push({
      field: 'typography.fontFamilies.body',
      message: 'Body font family is required',
      severity: 'error',
    });
  }

  const textPrimaryContrast = getContrastRatio(
    config.colors.light.text.primary,
    config.colors.light.background.page
  );

  if (textPrimaryContrast < 4.5) {
    errors.push({
      field: 'colors.light.text.primary',
      message: `Text contrast ratio is ${textPrimaryContrast.toFixed(2)}:1. WCAG AA requires 4.5:1 minimum`,
      severity: 'warning',
    });
  }

  return errors;
}

export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

export function getContrastRatio(color1: string, color2: string): number {
  if (!isValidHexColor(color1) || !isValidHexColor(color2)) return 0;

  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      const val = c / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function validateColorPalette(colors: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredColors = [
    'primary',
    'secondary',
    'accent',
    'background.page',
    'background.surface',
    'text.primary',
    'text.secondary',
  ];

  requiredColors.forEach((path) => {
    const parts = path.split('.');
    let value = colors;

    for (const part of parts) {
      value = value?.[part];
    }

    if (!value || !isValidHexColor(value)) {
      errors.push({
        field: `colors.${path}`,
        message: `Color ${path} must be a valid hex color`,
        severity: 'error',
      });
    }
  });

  return errors;
}
