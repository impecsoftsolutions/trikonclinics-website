import type { ThemeConfig } from '../types/modernTheme';
import { convertColorPalette } from './colorConversion';

export function applyThemeToDocument(config: ThemeConfig): void {
  try {
    const root = document.documentElement;

    const convertedColors = convertColorPalette(config.colors);

    Object.entries(convertedColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    if (config.typography) {
      root.style.setProperty('--font-heading', config.typography.fontFamilies.heading);
      root.style.setProperty('--font-body', config.typography.fontFamilies.body);
      root.style.setProperty('--font-mono', config.typography.fontFamilies.mono);
    }

    if (config.designTokens) {
      if (config.designTokens.borderRadius) {
        Object.entries(config.designTokens.borderRadius).forEach(([key, value]) => {
          root.style.setProperty(`--radius-${key}`, value);
        });
      }

      if (config.designTokens.shadows) {
        Object.entries(config.designTokens.shadows).forEach(([key, value]) => {
          root.style.setProperty(`--shadow-${key}`, value);
        });
      }

      if (config.designTokens.spacing) {
        Object.entries(config.designTokens.spacing).forEach(([key, value]) => {
          root.style.setProperty(`--spacing-${key}`, value);
        });
      }

      if (config.designTokens.blur) {
        Object.entries(config.designTokens.blur).forEach(([key, value]) => {
          root.style.setProperty(`--blur-${key}`, value);
        });
      }

      if (config.designTokens.opacity) {
        Object.entries(config.designTokens.opacity).forEach(([key, value]) => {
          root.style.setProperty(`--opacity-${key}`, value.toString());
        });
      }
    }

    if (config.animations) {
      if (config.animations.durations) {
        Object.entries(config.animations.durations).forEach(([key, value]) => {
          root.style.setProperty(`--duration-${key}`, value);
        });
      }

      if (config.animations.easings) {
        Object.entries(config.animations.easings).forEach(([key, value]) => {
          root.style.setProperty(`--easing-${key}`, value);
        });
      }
    }

    if (config.layoutTypography) {
      root.style.setProperty('--font-size-h1', config.layoutTypography.headingSizes.h1);
      root.style.setProperty('--font-size-h2', config.layoutTypography.headingSizes.h2);
      root.style.setProperty('--font-size-h3', config.layoutTypography.headingSizes.h3);
      root.style.setProperty('--font-weight-heading', config.layoutTypography.headingWeight);
      root.style.setProperty('--line-height-heading', config.layoutTypography.headingLineHeight);
    }

    if (config.layoutSpacing) {
      root.style.setProperty('--section-padding-y', config.layoutSpacing.sectionPaddingY);
      root.style.setProperty('--card-padding', config.layoutSpacing.cardPadding);
      root.style.setProperty('--element-gap', config.layoutSpacing.elementGap);
    }

    console.log('[Theme System] Applied theme to document');
  } catch (error) {
    console.error('[Theme System] Error applying theme to document:', error);
  }
}

export function clearThemeFromDocument(): void {
  try {
    const root = document.documentElement;
    const styles = root.style;

    for (let i = styles.length - 1; i >= 0; i--) {
      const property = styles[i];
      if (
        property.startsWith('--color-') ||
        property.startsWith('--font-') ||
        property.startsWith('--radius-') ||
        property.startsWith('--shadow-') ||
        property.startsWith('--spacing-') ||
        property.startsWith('--blur-') ||
        property.startsWith('--opacity-') ||
        property.startsWith('--duration-') ||
        property.startsWith('--easing-')
      ) {
        root.style.removeProperty(property);
      }
    }
  } catch (error) {
    console.error('[Theme System] Error clearing theme from document:', error);
  }
}
