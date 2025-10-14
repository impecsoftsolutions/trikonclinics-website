import type { ThemeConfig } from '../types/modernTheme';

interface ChangeDetail {
  category: string;
  changes: string[];
}

export function generateChangeDescription(
  originalConfig: ThemeConfig,
  newConfig: ThemeConfig
): string {
  const changes: ChangeDetail[] = [];

  detectColorChanges(originalConfig, newConfig, changes);
  detectTypographyChanges(originalConfig, newConfig, changes);
  detectLayoutChanges(originalConfig, newConfig, changes);
  detectDesignTokenChanges(originalConfig, newConfig, changes);
  detectAnimationChanges(originalConfig, newConfig, changes);
  detectAccessibilityChanges(originalConfig, newConfig, changes);

  if (changes.length === 0) {
    return 'Theme configuration updated';
  }

  const summary = changes
    .map((change) => {
      const changeCount = change.changes.length;
      if (changeCount === 1) {
        return `${change.category}: ${change.changes[0]}`;
      } else if (changeCount === 2) {
        return `${change.category}: ${change.changes[0]} and ${change.changes[1]}`;
      } else {
        return `${change.category}: ${changeCount} updates`;
      }
    })
    .join('; ');

  return summary;
}

function detectColorChanges(
  original: ThemeConfig,
  updated: ThemeConfig,
  changes: ChangeDetail[]
): void {
  const colorChanges: string[] = [];

  ['light', 'dark'].forEach((mode) => {
    const modeKey = mode as 'light' | 'dark';
    const origColors = original.colors[modeKey];
    const newColors = updated.colors[modeKey];

    if (origColors.primary !== newColors.primary) {
      colorChanges.push(`${mode} primary color`);
    }
    if (origColors.secondary !== newColors.secondary) {
      colorChanges.push(`${mode} secondary color`);
    }
    if (origColors.accent !== newColors.accent) {
      colorChanges.push(`${mode} accent color`);
    }

    if (JSON.stringify(origColors.background) !== JSON.stringify(newColors.background)) {
      colorChanges.push(`${mode} background colors`);
    }
    if (JSON.stringify(origColors.text) !== JSON.stringify(newColors.text)) {
      colorChanges.push(`${mode} text colors`);
    }
    if (JSON.stringify(origColors.semantic) !== JSON.stringify(newColors.semantic)) {
      colorChanges.push(`${mode} semantic colors`);
    }
    if (JSON.stringify(origColors.border) !== JSON.stringify(newColors.border)) {
      colorChanges.push(`${mode} border colors`);
    }
  });

  if (colorChanges.length > 0) {
    changes.push({
      category: 'Colors',
      changes: colorChanges,
    });
  }
}

function detectTypographyChanges(
  original: ThemeConfig,
  updated: ThemeConfig,
  changes: ChangeDetail[]
): void {
  const typographyChanges: string[] = [];

  if (
    original.typography.fontFamilies.heading !== updated.typography.fontFamilies.heading
  ) {
    typographyChanges.push('heading font');
  }
  if (original.typography.fontFamilies.body !== updated.typography.fontFamilies.body) {
    typographyChanges.push('body font');
  }
  if (original.typography.fontFamilies.mono !== updated.typography.fontFamilies.mono) {
    typographyChanges.push('monospace font');
  }

  if (
    JSON.stringify(original.typography.fontSizes) !==
    JSON.stringify(updated.typography.fontSizes)
  ) {
    typographyChanges.push('font sizes');
  }
  if (
    JSON.stringify(original.typography.fontWeights) !==
    JSON.stringify(updated.typography.fontWeights)
  ) {
    typographyChanges.push('font weights');
  }
  if (
    JSON.stringify(original.typography.lineHeights) !==
    JSON.stringify(updated.typography.lineHeights)
  ) {
    typographyChanges.push('line heights');
  }

  if (typographyChanges.length > 0) {
    changes.push({
      category: 'Typography',
      changes: typographyChanges,
    });
  }
}

function detectLayoutChanges(
  original: ThemeConfig,
  updated: ThemeConfig,
  changes: ChangeDetail[]
): void {
  const layoutChanges: string[] = [];

  if (
    JSON.stringify(original.layouts.navigation) !==
    JSON.stringify(updated.layouts.navigation)
  ) {
    layoutChanges.push('navigation layout');
  }
  if (JSON.stringify(original.layouts.hero) !== JSON.stringify(updated.layouts.hero)) {
    layoutChanges.push('hero layout');
  }
  if (JSON.stringify(original.layouts.cards) !== JSON.stringify(updated.layouts.cards)) {
    layoutChanges.push('card layout');
  }
  if (
    JSON.stringify(original.layouts.sections) !== JSON.stringify(updated.layouts.sections)
  ) {
    layoutChanges.push('section layout');
  }

  if (
    JSON.stringify(original.layouts.pages) !== JSON.stringify(updated.layouts.pages)
  ) {
    layoutChanges.push('page layouts');
  }

  if (layoutChanges.length > 0) {
    changes.push({
      category: 'Layouts',
      changes: layoutChanges,
    });
  }
}

function detectDesignTokenChanges(
  original: ThemeConfig,
  updated: ThemeConfig,
  changes: ChangeDetail[]
): void {
  const tokenChanges: string[] = [];

  if (
    JSON.stringify(original.designTokens.borderRadius) !==
    JSON.stringify(updated.designTokens.borderRadius)
  ) {
    tokenChanges.push('border radius');
  }
  if (
    JSON.stringify(original.designTokens.shadows) !==
    JSON.stringify(updated.designTokens.shadows)
  ) {
    tokenChanges.push('shadows');
  }
  if (
    JSON.stringify(original.designTokens.spacing) !==
    JSON.stringify(updated.designTokens.spacing)
  ) {
    tokenChanges.push('spacing');
  }
  if (
    JSON.stringify(original.designTokens.blur) !== JSON.stringify(updated.designTokens.blur)
  ) {
    tokenChanges.push('blur effects');
  }

  if (tokenChanges.length > 0) {
    changes.push({
      category: 'Design Tokens',
      changes: tokenChanges,
    });
  }
}

function detectAnimationChanges(
  original: ThemeConfig,
  updated: ThemeConfig,
  changes: ChangeDetail[]
): void {
  const animationChanges: string[] = [];

  if (
    JSON.stringify(original.animations.features) !==
    JSON.stringify(updated.animations.features)
  ) {
    animationChanges.push('animation features');
  }
  if (
    JSON.stringify(original.animations.durations) !==
    JSON.stringify(updated.animations.durations)
  ) {
    animationChanges.push('animation durations');
  }
  if (
    JSON.stringify(original.animations.easings) !==
    JSON.stringify(updated.animations.easings)
  ) {
    animationChanges.push('animation easings');
  }

  if (animationChanges.length > 0) {
    changes.push({
      category: 'Animations',
      changes: animationChanges,
    });
  }
}

function detectAccessibilityChanges(
  original: ThemeConfig,
  updated: ThemeConfig,
  changes: ChangeDetail[]
): void {
  const a11yChanges: string[] = [];

  if (
    JSON.stringify(original.accessibility.focusIndicators) !==
    JSON.stringify(updated.accessibility.focusIndicators)
  ) {
    a11yChanges.push('focus indicators');
  }
  if (
    JSON.stringify(original.accessibility.keyboardNavigation) !==
    JSON.stringify(updated.accessibility.keyboardNavigation)
  ) {
    a11yChanges.push('keyboard navigation');
  }
  if (
    JSON.stringify(original.accessibility.highContrast) !==
    JSON.stringify(updated.accessibility.highContrast)
  ) {
    a11yChanges.push('high contrast settings');
  }
  if (
    JSON.stringify(original.accessibility.reducedMotion) !==
    JSON.stringify(updated.accessibility.reducedMotion)
  ) {
    a11yChanges.push('reduced motion settings');
  }

  if (a11yChanges.length > 0) {
    changes.push({
      category: 'Accessibility',
      changes: a11yChanges,
    });
  }
}
