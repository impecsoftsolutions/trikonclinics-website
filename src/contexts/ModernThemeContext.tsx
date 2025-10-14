import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { ModernTheme, ThemeConfig, LayoutTypography, LayoutSpacing } from '../types/modernTheme';
import { FALLBACK_THEME_CONFIG, FALLBACK_THEME_NAME } from '../constants/fallbackTheme';
import {
  getCachedTheme,
  setCachedTheme,
  getCachedHash,
} from '../utils/themeCache';
import { applyThemeToDocument } from '../utils/themeApplication';
import { loadThemeFonts, removeOldFonts } from '../utils/fontLoader';

interface ModernThemeContextType {
  theme: ThemeConfig;
  themeName: string;
  loading: boolean;
  error: string | null;
  layoutStyle: 'modern' | 'minimal' | 'playful';
  layoutTypography: LayoutTypography;
  layoutSpacing: LayoutSpacing;
  healthLibraryEnabled: boolean;
}

const ModernThemeContext = createContext<ModernThemeContextType | undefined>(undefined);

interface ModernThemeProviderProps {
  children: ReactNode;
}

export const ModernThemeProvider: React.FC<ModernThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(FALLBACK_THEME_CONFIG);
  const [themeName, setThemeName] = useState<string>(FALLBACK_THEME_NAME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [healthLibraryEnabled, setHealthLibraryEnabled] = useState<boolean>(true);

  const loadActiveTheme = async (): Promise<void> => {
    try {
      console.log('[Theme System] Loading active theme from database');

      const { data: settings, error: settingsError } = await supabase
        .from('modern_site_settings')
        .select('active_theme_id, theme_hash, health_library_enabled')
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        console.error('[Theme System] Error loading site settings:', settingsError);
        throw settingsError;
      }

      if (!settings || !settings.active_theme_id) {
        console.warn('[Theme System] No active theme found, using fallback');
        setTheme(FALLBACK_THEME_CONFIG);
        setThemeName(FALLBACK_THEME_NAME);
        setHealthLibraryEnabled(settings?.health_library_enabled ?? true);
        return;
      }

      setHealthLibraryEnabled(settings.health_library_enabled ?? true);

      const cachedTheme = getCachedTheme();
      const cachedHash = getCachedHash();

      if (cachedTheme && cachedHash === settings.theme_hash) {
        console.log('[Theme System] Using cached theme:', cachedTheme.name);
        setTheme(cachedTheme.config);
        setThemeName(cachedTheme.name);
        setCurrentHash(settings.theme_hash);

        if (cachedTheme.config.typography?.fontUrls) {
          loadThemeFonts(cachedTheme.config.typography.fontUrls);
        }
        return;
      }

      const { data: themeData, error: themeError } = await supabase
        .from('modern_themes')
        .select('*')
        .eq('id', settings.active_theme_id)
        .maybeSingle();

      if (themeError) {
        console.error('[Theme System] Error loading theme:', themeError);
        throw themeError;
      }

      if (!themeData) {
        console.warn('[Theme System] Active theme not found, using fallback');
        setTheme(FALLBACK_THEME_CONFIG);
        setThemeName(FALLBACK_THEME_NAME);
        return;
      }

      console.log('[Theme System] Loaded theme:', themeData.name);
      setTheme(themeData.config);
      setThemeName(themeData.name);
      setCurrentHash(settings.theme_hash);

      setCachedTheme(themeData);

      if (themeData.config.typography?.fontUrls) {
        loadThemeFonts(themeData.config.typography.fontUrls);
      }
    } catch (error) {
      console.error('[Theme System] Error loading active theme:', error);
      console.log('[Theme System] Falling back to:', FALLBACK_THEME_NAME);
      setTheme(FALLBACK_THEME_CONFIG);
      setThemeName(FALLBACK_THEME_NAME);
      setError('Failed to load theme');

      if (FALLBACK_THEME_CONFIG.typography?.fontUrls) {
        loadThemeFonts(FALLBACK_THEME_CONFIG.typography.fontUrls);
      }
    }
  };

  const checkForThemeUpdates = async (): Promise<void> => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('modern_site_settings')
        .select('theme_hash, active_theme_id, health_library_enabled')
        .limit(1)
        .maybeSingle();

      if (settingsError || !settings) {
        console.error('[Theme System] Polling failed, will retry');
        return;
      }

      setHealthLibraryEnabled(settings.health_library_enabled ?? true);

      if (settings.theme_hash !== currentHash) {
        console.log('[Theme System] Hash changed from', currentHash, 'to', settings.theme_hash, ', reloading theme');

        const { data: themeData, error: themeError } = await supabase
          .from('modern_themes')
          .select('*')
          .eq('id', settings.active_theme_id)
          .maybeSingle();

        if (themeError || !themeData) {
          console.error('[Theme System] Error reloading theme:', themeError);
          return;
        }

        console.log('[Theme System] Theme changed to:', themeData.name);
        setTheme(themeData.config);
        setThemeName(themeData.name);
        setCurrentHash(settings.theme_hash);

        setCachedTheme(themeData);

        if (themeData.config.typography?.fontUrls) {
          removeOldFonts(themeData.config.typography.fontUrls);
          loadThemeFonts(themeData.config.typography.fontUrls);
        }

        applyThemeToDocument(themeData.config);
      }
    } catch (error) {
      console.error('[Theme System] Polling error:', error);
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      await loadActiveTheme();
      setLoading(false);
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (!loading) {
      const pollInterval = setInterval(() => {
        checkForThemeUpdates();
      }, 60000);

      return () => clearInterval(pollInterval);
    }
  }, [loading, currentHash]);

  useEffect(() => {
    if (!loading) {
      applyThemeToDocument(theme);
    }
  }, [theme, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#4F86F7', borderTopColor: 'transparent' }}
          ></div>
          <p className="text-gray-600 font-medium">Loading theme...</p>
        </div>
      </div>
    );
  }

  const getLayoutStyle = (): 'modern' | 'minimal' | 'playful' => {
    return theme.layoutStyle || 'modern';
  };

  const getLayoutTypography = (): LayoutTypography => {
    return theme.layoutTypography || {
      headingSizes: { h1: '48px', h2: '36px', h3: '28px' },
      headingWeight: '700',
      headingLineHeight: '1.2',
    };
  };

  const getLayoutSpacing = (): LayoutSpacing => {
    return theme.layoutSpacing || {
      sectionPaddingY: '80px',
      cardPadding: '32px',
      elementGap: '32px',
    };
  };

  return (
    <ModernThemeContext.Provider
      value={{
        theme,
        themeName,
        loading,
        error,
        layoutStyle: getLayoutStyle(),
        layoutTypography: getLayoutTypography(),
        layoutSpacing: getLayoutSpacing(),
        healthLibraryEnabled,
      }}
    >
      {children}
    </ModernThemeContext.Provider>
  );
};

export const useModernThemeContext = () => {
  const context = useContext(ModernThemeContext);
  if (context === undefined) {
    throw new Error('useModernThemeContext must be used within a ModernThemeProvider');
  }
  return context;
};
