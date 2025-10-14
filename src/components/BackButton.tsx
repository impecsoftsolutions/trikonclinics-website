import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useModernTheme } from '../hooks/useModernTheme';

interface BackButtonProps {
  to: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to, className = '' }) => {
  const { colors, backButton } = useModernTheme();
  const [isHovered, setIsHovered] = useState(false);

  const buttonText = backButton?.text || 'Back';
  const bgColor = (backButton?.backgroundColor && backButton.backgroundColor.trim()) || 'transparent';
  const textColor = (backButton?.textColor && backButton.textColor.trim()) || `hsl(var(--color-primary))`;
  const borderColor = (backButton?.borderColor && backButton.borderColor.trim()) || `hsl(var(--color-border-default))`;
  const hoverBgColor = (backButton?.hoverBackgroundColor && backButton.hoverBackgroundColor.trim()) || `hsla(var(--color-primary), 0.05)`;
  const hoverTextColor = (backButton?.hoverTextColor && backButton.hoverTextColor.trim()) || `hsl(var(--color-primary))`;

  const buttonStyle = {
    backgroundColor: isHovered && hoverBgColor ? hoverBgColor : bgColor,
    color: isHovered && hoverTextColor ? hoverTextColor : textColor,
    borderColor: borderColor,
  };

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 border ${className}`}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ArrowLeft className="h-5 w-5" />
      {buttonText}
    </Link>
  );
};
