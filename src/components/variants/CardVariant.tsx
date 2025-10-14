import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';
import { CardModern } from './CardModern';
import { CardMinimal } from './CardMinimal';
import { CardPlayful } from './CardPlayful';

interface CardVariantProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string | null;
  rating?: number | null;
  author?: string;
}

export const CardVariant: React.FC<CardVariantProps> = (props) => {
  const { layoutStyle } = useModernTheme();

  switch (layoutStyle) {
    case 'modern':
      return <CardModern {...props} />;
    case 'minimal':
      return <CardMinimal {...props} />;
    case 'playful':
      return <CardPlayful {...props} />;
    default:
      return <CardModern {...props} />;
  }
};
