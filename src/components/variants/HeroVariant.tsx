import React from 'react';
import { useModernTheme } from '../../hooks/useModernTheme';
import { HeroModern } from './HeroModern';
import { HeroMinimal } from './HeroMinimal';
import { HeroPlayful } from './HeroPlayful';

interface HeroVariantProps {
  hospitalName?: string;
  tagline?: string;
  description?: string;
  bannerImage?: string | null;
  appointmentLink?: string | null;
  phoneNumber?: string | null;
}

export const HeroVariant: React.FC<HeroVariantProps> = (props) => {
  const { layoutStyle } = useModernTheme();

  switch (layoutStyle) {
    case 'minimal':
      return <HeroMinimal {...props} />;
    case 'playful':
      return <HeroPlayful {...props} />;
    case 'modern':
    default:
      return <HeroModern {...props} />;
  }
};
