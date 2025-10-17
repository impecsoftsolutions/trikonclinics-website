export function hexToHSL(hex: string): string {
  try {
    let cleanHex = hex.trim().replace(/^#/, '');

    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    if (cleanHex.length !== 6) {
      console.error('[Theme System] Invalid hex color:', hex);
      return '0 0% 50%';
    }

    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    const hDeg = Math.round(h * 360);
    const sPercent = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    const hslString = `${hDeg} ${sPercent}% ${lPercent}%`;

    return hslString;
  } catch (error) {
    console.error('[Theme System] Error converting color:', hex, error);
    return '0 0% 50%';
  }
}

export function convertColorPalette(colors: any): Record<string, string> {
  const converted: Record<string, string> = {};

  try {
    if (colors.primary) converted.primary = hexToHSL(colors.primary);
    if (colors.secondary) converted.secondary = hexToHSL(colors.secondary);
    if (colors.accent) converted.accent = hexToHSL(colors.accent);

    // Handle background colors (supports both flat string and nested object)
    if (colors.background) {
      if (typeof colors.background === 'string') {
        // Flat format: colors.background = "#FFFACD"
        const bgColor = hexToHSL(colors.background);
        converted['bg-page'] = bgColor;
        converted['bg-surface'] = bgColor;
        converted['bg-elevated'] = bgColor;
      } else if (typeof colors.background === 'object') {
        // Nested format: colors.background = { page: "#FFFACD", surface: "#F9FAFB", elevated: "#FFFFFF" }
        converted['bg-page'] = hexToHSL(colors.background.page);
        converted['bg-surface'] = hexToHSL(colors.background.surface);
        converted['bg-elevated'] = hexToHSL(colors.background.elevated);
      }
    }

    // Handle text colors (supports both flat string and nested object)
    if (colors.text) {
      if (typeof colors.text === 'string') {
        // Flat format: colors.text = "#1F2937"
        const textColor = hexToHSL(colors.text);
        converted['text-primary'] = textColor;
        converted['text-secondary'] = textColor;
        converted['text-muted'] = textColor;
        converted['text-inverse'] = hexToHSL('#FFFFFF'); // Use white as inverse for flat format
      } else if (typeof colors.text === 'object') {
        // Nested format: colors.text = { primary: "#1F2937", secondary: "#6B7280", ... }
        converted['text-primary'] = hexToHSL(colors.text.primary);
        converted['text-secondary'] = hexToHSL(colors.text.secondary);
        converted['text-muted'] = hexToHSL(colors.text.muted);
        converted['text-inverse'] = hexToHSL(colors.text.inverse);
      }
    }

    // Handle semantic colors (supports both flat string and nested object)
    if (colors.semantic) {
      if (typeof colors.semantic === 'string') {
        // Flat format fallback
        const semanticColor = hexToHSL(colors.semantic);
        converted['semantic-success'] = semanticColor;
        converted['semantic-warning'] = semanticColor;
        converted['semantic-error'] = semanticColor;
        converted['semantic-info'] = semanticColor;
      } else if (typeof colors.semantic === 'object') {
        // Nested format: colors.semantic = { success: "#10B981", warning: "#F59E0B", ... }
        converted['semantic-success'] = hexToHSL(colors.semantic.success);
        converted['semantic-warning'] = hexToHSL(colors.semantic.warning);
        converted['semantic-error'] = hexToHSL(colors.semantic.error);
        converted['semantic-info'] = hexToHSL(colors.semantic.info);
      }
    }

    // Handle border colors (supports both flat string and nested object)
    if (colors.border) {
      if (typeof colors.border === 'string') {
        // Flat format: colors.border = "#E5E7EB"
        const borderColor = hexToHSL(colors.border);
        converted['border-default'] = borderColor;
        converted['border-hover'] = borderColor;
        converted['border-focus'] = borderColor;
      } else if (typeof colors.border === 'object') {
        // Nested format: colors.border = { default: "#E5E7EB", hover: "#D1D5DB", focus: "#0066CC" }
        converted['border-default'] = hexToHSL(colors.border.default);
        converted['border-hover'] = hexToHSL(colors.border.hover);
        converted['border-focus'] = hexToHSL(colors.border.focus);
      }
    }

    if (colors.decorativeIcon) {
      converted['decorative-icon'] = hexToHSL(colors.decorativeIcon);
    }
  } catch (error) {
    console.error('[Theme System] Error converting color palette:', error);
  }

  return converted;
}

export function gradientToCSS(gradient: any): string {
  try {
    if (!gradient || !gradient.stops || gradient.stops.length === 0) {
      return 'none';
    }

    const type = gradient.type || 'linear';
    const angle = gradient.angle !== undefined ? gradient.angle : 135;

    const stops = gradient.stops
      .map((stop: any) => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stops})`;
    } else if (type === 'radial') {
      return `radial-gradient(circle, ${stops})`;
    }

    return 'none';
  } catch (error) {
    console.error('[Theme System] Error converting gradient:', error);
    return 'none';
  }
}
