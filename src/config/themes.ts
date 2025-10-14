export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    textPrimary: string;
    textSecondary: string;
    backgroundLight: string;
    backgroundDark: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
    headingLetterSpacing: string;
    bodyLetterSpacing: string;
  };
  visualStyle: {
    borderRadius: string;
    shadowStyle: string;
    buttonRadius: string;
    cardRadius: string;
  };
  patterns?: {
    enabled: boolean;
    type: string;
    svgPattern?: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  'modern-medical': {
    id: 'modern-medical',
    name: 'Modern Medical',
    description: 'Clean blue tones with minimalist design and modern typography',
    colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      backgroundLight: '#f9fafb',
      backgroundDark: '#111827',
    },
    typography: {
      headingFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingWeight: '700',
      bodyWeight: '400',
      headingLetterSpacing: '-0.02em',
      bodyLetterSpacing: 'normal',
    },
    visualStyle: {
      borderRadius: '0.75rem',
      shadowStyle: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
    },
  },

  'classic-healthcare': {
    id: 'classic-healthcare',
    name: 'Classic Healthcare',
    description: 'Traditional navy and gold with professional serif typography',
    colors: {
      primary: '#1e3a8a',
      secondary: '#1e40af',
      accent: '#d97706',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      textPrimary: '#1f2937',
      textSecondary: '#4b5563',
      backgroundLight: '#f8fafc',
      backgroundDark: '#0f172a',
    },
    typography: {
      headingFont: "'Georgia', 'Times New Roman', serif",
      bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingWeight: '600',
      bodyWeight: '400',
      headingLetterSpacing: 'normal',
      bodyLetterSpacing: 'normal',
    },
    visualStyle: {
      borderRadius: '0.5rem',
      shadowStyle: '0 2px 4px rgba(0, 0, 0, 0.1)',
      buttonRadius: '0.5rem',
      cardRadius: '0.75rem',
    },
  },

  'warm-caring': {
    id: 'warm-caring',
    name: 'Warm & Caring',
    description: 'Friendly warm colors with soft rounded corners and approachable design',
    colors: {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c',
      success: '#16a34a',
      warning: '#eab308',
      error: '#dc2626',
      textPrimary: '#292524',
      textSecondary: '#78716c',
      backgroundLight: '#fef8f3',
      backgroundDark: '#292524',
    },
    typography: {
      headingFont: "'Nunito', 'Quicksand', sans-serif",
      bodyFont: "'Nunito', 'Quicksand', sans-serif",
      headingWeight: '700',
      bodyWeight: '400',
      headingLetterSpacing: 'normal',
      bodyLetterSpacing: 'normal',
    },
    visualStyle: {
      borderRadius: '1.5rem',
      shadowStyle: '0 8px 16px rgba(234, 88, 12, 0.1)',
      buttonRadius: '2rem',
      cardRadius: '1.5rem',
    },
  },

  'bold-confident': {
    id: 'bold-confident',
    name: 'Bold & Confident',
    description: 'Strong colors with high contrast and dynamic sharp design',
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#ef4444',
      success: '#15803d',
      warning: '#ca8a04',
      error: '#7f1d1d',
      textPrimary: '#0a0a0a',
      textSecondary: '#525252',
      backgroundLight: '#ffffff',
      backgroundDark: '#0a0a0a',
    },
    typography: {
      headingFont: "'Montserrat', 'Arial Black', sans-serif",
      bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingWeight: '800',
      bodyWeight: '400',
      headingLetterSpacing: '-0.03em',
      bodyLetterSpacing: 'normal',
    },
    visualStyle: {
      borderRadius: '0.25rem',
      shadowStyle: '0 10px 20px rgba(0, 0, 0, 0.2)',
      buttonRadius: '0.25rem',
      cardRadius: '0.5rem',
    },
  },

  'minimal-clean': {
    id: 'minimal-clean',
    name: 'Minimal & Clean',
    description: 'Maximum white space with simple elegant lines and subtle accents',
    colors: {
      primary: '#6b7280',
      secondary: '#4b5563',
      accent: '#9ca3af',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      textPrimary: '#111827',
      textSecondary: '#9ca3af',
      backgroundLight: '#ffffff',
      backgroundDark: '#1f2937',
    },
    typography: {
      headingFont: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
      bodyFont: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
      headingWeight: '300',
      bodyWeight: '300',
      headingLetterSpacing: '0.02em',
      bodyLetterSpacing: '0.01em',
    },
    visualStyle: {
      borderRadius: '0rem',
      shadowStyle: '0 1px 2px rgba(0, 0, 0, 0.05)',
      buttonRadius: '0rem',
      cardRadius: '0rem',
    },
  },

  'trikon-brand': {
    id: 'trikon-brand',
    name: 'Trikon Brand',
    description: 'Signature red, cyan, and purple with hexagon patterns throughout',
    colors: {
      primary: '#E31E24',
      secondary: '#B71C1C',
      accent: '#4DD0E1',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#dc2626',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      backgroundLight: '#f9fafb',
      backgroundDark: '#1a1a2e',
    },
    typography: {
      headingFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingWeight: '700',
      bodyWeight: '400',
      headingLetterSpacing: '-0.01em',
      bodyLetterSpacing: 'normal',
    },
    visualStyle: {
      borderRadius: '0.5rem',
      shadowStyle: '0 4px 12px rgba(227, 30, 36, 0.15)',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
    },
    patterns: {
      enabled: true,
      type: 'hexagon',
      svgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 15L45 22.5L45 37.5L30 45L15 37.5L15 22.5Z' fill='none' stroke='%234DD0E1' stroke-width='1' opacity='0.15'/%3E%3C/svg%3E")`,
    },
  },
};

export const getTheme = (themeName: string): ThemeConfig => {
  return themes[themeName] || themes['modern-medical'];
};

export const getThemeList = (): ThemeConfig[] => {
  return Object.values(themes);
};
