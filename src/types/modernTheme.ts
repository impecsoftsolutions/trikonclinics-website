export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: {
    page: string;
    surface: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  border: {
    default: string;
    hover: string;
    focus: string;
  };
  decorativeIcon?: string;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface Gradient {
  name: string;
  type: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}

export interface DesignTokens {
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  blur: Record<string, string>;
  opacity: Record<string, number>;
  borderWidth: Record<string, string>;
  containerMaxWidth: Record<string, string>;
}

export interface NavigationLayout {
  style: 'floating' | 'sticky' | 'fixed';
  position: 'top' | 'bottom';
  transparent: boolean;
  blur?: boolean;
  activeBackground?: string | null;
}

export interface HeroLayout {
  layout: 'split-screen' | 'minimal' | 'friendly' | 'centered';
  imagePosition: 'left' | 'right' | 'none' | 'background';
  textAlign: 'left' | 'center' | 'right';
  gradient: boolean;
}

export interface PageLayout {
  layout: 'grid' | 'list' | 'carousel' | 'masonry' | 'split' | 'centered' | 'friendly';
  columns?: number;
  cardStyle?: string;
  spacing?: string;
  iconSize?: string;
  itemsVisible?: number;
  autoplay?: boolean;
  mapPosition?: string;
  formStyle?: string;
}

export interface CardLayout {
  radius: string;
  shadow: string;
  padding: string;
  hoverEffect: 'lift' | 'subtle' | 'bounce' | 'none';
  hoverScale?: string;
}

export interface SectionLayout {
  paddingY: string;
  maxWidth: string;
  gutter?: string;
}

export interface Layouts {
  navigation: NavigationLayout;
  hero: HeroLayout;
  pages: {
    doctors: PageLayout;
    services: PageLayout;
    testimonials: PageLayout;
    contact: PageLayout;
  };
  cards: CardLayout;
  sections: SectionLayout;
}

export interface Animations {
  durations: Record<string, string>;
  easings: Record<string, string>;
  delays: Record<string, string>;
  features: {
    scrollReveal: boolean;
    hoverEffects: boolean;
    pageTransitions: boolean;
    reduceMotionRespect: boolean;
  };
}

export interface HighContrastSettings {
  enabled: boolean;
  textContrast: string;
  borderContrast: string;
}

export interface FocusIndicators {
  style: 'outline' | 'shadow' | 'border';
  width: string;
  offset: string;
  color: string;
  contrast: string;
}

export interface ReducedMotion {
  respectPreference: boolean;
  fallbackDuration: string;
}

export interface KeyboardNavigation {
  skipLinks: boolean;
  focusVisible: boolean;
  tabIndex?: boolean;
}

export interface ScreenReader {
  announcements: boolean;
  landmarkLabels: boolean;
  ariaLabels?: boolean;
}

export interface Accessibility {
  highContrast: HighContrastSettings;
  focusIndicators: FocusIndicators;
  reducedMotion: ReducedMotion;
  keyboardNavigation: KeyboardNavigation;
  screenReader: ScreenReader;
  minimumTargetSize: string;
}

export interface Typography {
  fontFamilies: {
    heading: string;
    body: string;
    mono: string;
  };
  fontUrls: string[];
  fontSizes: Record<string, string>;
  fontWeights: Record<string, string>;
  lineHeights: Record<string, string>;
  letterSpacing: Record<string, string>;
  fontLoadingStrategy: string;
}

export interface LayoutTypography {
  headingSizes: {
    h1: string;
    h2: string;
    h3: string;
  };
  headingWeight: string;
  headingLineHeight: string;
}

export interface LayoutSpacing {
  sectionPaddingY: string;
  cardPadding: string;
  elementGap: string;
}

export interface EmergencyButton {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface BackButton {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  hoverBackgroundColor?: string;
  hoverTextColor?: string;
}

export interface PrimaryCTAButton {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  hoverOpacity?: number;
  hoverBackgroundColor?: string;
}

export interface ThemeConfig {
  layoutStyle?: 'modern' | 'minimal' | 'playful';
  layoutTypography?: LayoutTypography;
  layoutSpacing?: LayoutSpacing;
  colors: ColorPalette;
  gradients: Gradient[];
  designTokens: DesignTokens;
  layouts: Layouts;
  animations: Animations;
  accessibility: Accessibility;
  typography: Typography;
  emergencyButton?: EmergencyButton;
  backButton?: BackButton;
  primaryCtaButton?: PrimaryCTAButton;
}

export interface ModernTheme {
  id: string;
  name: string;
  slug: string;
  description: string;
  config: ThemeConfig;
  is_preset: boolean;
  config_hash: string | null;
  validation_status: 'passed' | 'failed' | 'pending';
  validation_errors: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModernSiteSettings {
  id: string;
  active_theme_id: string | null;
  previous_theme_id: string | null;
  theme_hash: string | null;
  activated_at: string | null;
  activated_by: string | null;
  rollback_deadline: string | null;
  high_contrast_enabled: boolean;
  reduced_motion_enabled: boolean;
  updated_at: string;
}

export interface ModernThemeVersion {
  id: string;
  theme_id: string;
  version_number: number;
  config_snapshot: ThemeConfig;
  change_description: string | null;
  change_summary: any;
  created_by: string | null;
  created_at: string;
  is_rollback: boolean;
}

export interface ActiveThemeInfo extends ModernTheme {
  activated_at: string | null;
  rollback_deadline: string | null;
  previous_theme_id: string | null;
}

export interface ActivateThemeResponse {
  success: boolean;
  error?: string;
  theme_id?: string;
  theme_name?: string;
  theme_hash?: string;
  activated_at?: string;
  validation_errors?: any;
}

export interface RollbackThemeResponse {
  success: boolean;
  error?: string;
  message?: string;
  theme_id?: string;
}

export interface DuplicateThemeResponse {
  success: boolean;
  error?: string;
  theme_id?: string;
  name?: string;
  slug?: string;
}
