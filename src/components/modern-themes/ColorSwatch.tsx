import React, { useState } from 'react';

interface ColorSwatchProps {
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  label,
  size = 'md',
  showLabel = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`${sizeClasses[size]} rounded-lg border-2 border-gray-200 shadow-sm transition-transform hover:scale-110 cursor-pointer`}
          style={{ backgroundColor: color }}
          title={color}
        />
        {showTooltip && (
          <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
            {color}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
      {showLabel && label && (
        <span className="text-xs text-gray-600 font-medium">{label}</span>
      )}
    </div>
  );
};
