const loadedFonts = new Set<string>();

export function loadThemeFonts(fontUrls: string[]): void {
  if (!fontUrls || fontUrls.length === 0) {
    console.warn('[Theme System] No font URLs provided');
    return;
  }

  try {
    fontUrls.forEach((url) => {
      if (loadedFonts.has(url)) {
        return;
      }

      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (existingLink) {
        loadedFonts.add(url);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;

      link.onload = () => {
        console.log('[Theme System] Font loaded:', url);
        loadedFonts.add(url);
      };

      link.onerror = () => {
        console.error('[Theme System] Failed to load font:', url);
      };

      document.head.appendChild(link);
    });
  } catch (error) {
    console.error('[Theme System] Error loading fonts:', error);
  }
}

export function removeOldFonts(currentFontUrls: string[]): void {
  try {
    const allFontLinks = document.querySelectorAll('link[rel="stylesheet"]');

    allFontLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.includes('fonts.googleapis.com')) {
        if (!currentFontUrls.includes(href)) {
          link.remove();
          loadedFonts.delete(href);
          console.log('[Theme System] Removed old font:', href);
        }
      }
    });
  } catch (error) {
    console.error('[Theme System] Error removing old fonts:', error);
  }
}

export function clearLoadedFonts(): void {
  loadedFonts.clear();
}
