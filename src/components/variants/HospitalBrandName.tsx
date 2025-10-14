import React, { useEffect } from 'react';

interface HospitalBrandNameProps {
  hospitalName: string;
  accentColor?: string;
  textColor: string;
  className?: string;
  lineHeight?: string;
}

/**
 * HospitalBrandName - Consistent brand typography across all themes
 *
 * Renders "Trikon Clinics" with official brand fonts:
 * - "Trikon": Mr Eaves XL Mod OT Bold (weight 700)
 * - "Clinics": Mr Eaves XL Mod OT Light (weight 300)
 *
 * Only colors change per theme - fonts remain consistent
 */
export const HospitalBrandName: React.FC<HospitalBrandNameProps> = ({
  hospitalName,
  accentColor,
  textColor,
  className = '',
  lineHeight = '1.2',
}) => {
  // Load brand fonts once
  useEffect(() => {
    // Check if fonts are already loaded
    const existingBold = document.querySelector('link[href*="MrEavesXLModOT-Bold"]');
    const existingLight = document.querySelector('link[href*="MrEavesXLModOT-Light"]');

    if (!existingBold) {
      const linkBold = document.createElement('link');
      linkBold.href = 'https://db.onlinewebfonts.com/c/55730af0e8c910cc0c1e03d4b2785dfe?family=MrEavesXLModOT-Bold';
      linkBold.rel = 'stylesheet';
      linkBold.type = 'text/css';
      document.head.appendChild(linkBold);
    }

    if (!existingLight) {
      const linkLight = document.createElement('link');
      linkLight.href = 'https://db.onlinewebfonts.com/c/a387981e73780c2320ebdd50d5d38026?family=MrEavesXLModOT-Light';
      linkLight.rel = 'stylesheet';
      linkLight.type = 'text/css';
      document.head.appendChild(linkLight);
    }
  }, []);

  const words = hospitalName.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <span
      className={className}
      style={{
        lineHeight,
        color: textColor,
      }}
    >
      {/* First word: "Trikon" - Bold with accent color */}
      <span
        style={{
          fontFamily: 'MrEavesXLModOT-Bold, Inter, sans-serif',
          fontWeight: '700',
          color: accentColor || textColor,
        }}
      >
        {firstWord}
      </span>

      {/* Rest of words: "Clinics" - Light weight */}
      {restWords && (
        <span
          style={{
            fontFamily: 'MrEavesXLModOT-Light, Inter, sans-serif',
            fontWeight: '300',
          }}
        >
          {' '}{restWords}
        </span>
      )}
    </span>
  );
};
