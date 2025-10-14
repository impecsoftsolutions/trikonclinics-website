import type { ModernTheme } from '../types/modernTheme';

const CACHE_KEYS = {
  THEME: 'modern-theme-cache',
  HASH: 'modern-theme-hash',
} as const;

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('[Theme System] localStorage not available:', error);
    return false;
  }
}

export function getCachedTheme(): ModernTheme | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const cached = localStorage.getItem(CACHE_KEYS.THEME);
    if (!cached) return null;

    const theme = JSON.parse(cached);
    return theme;
  } catch (error) {
    console.error('[Theme System] Error reading cached theme:', error);
    return null;
  }
}

export function setCachedTheme(theme: ModernTheme): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(CACHE_KEYS.THEME, JSON.stringify(theme));
    if (theme.config_hash) {
      localStorage.setItem(CACHE_KEYS.HASH, theme.config_hash);
    }
  } catch (error) {
    console.error('[Theme System] Error caching theme:', error);
  }
}

export function getCachedHash(): string | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    return localStorage.getItem(CACHE_KEYS.HASH);
  } catch (error) {
    console.error('[Theme System] Error reading cached hash:', error);
    return null;
  }
}

export function clearThemeCache(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(CACHE_KEYS.THEME);
    localStorage.removeItem(CACHE_KEYS.HASH);
  } catch (error) {
    console.error('[Theme System] Error clearing cache:', error);
  }
}
