import React, { useState } from 'react';
import { Image, Calendar } from 'lucide-react';

interface EventThumbnailProps {
  imageUrl?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EventThumbnail: React.FC<EventThumbnailProps> = ({
  imageUrl,
  alt = 'Event thumbnail',
  size = 'sm',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const iconSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  if (!imageUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-200 ${className}`}
      >
        <Calendar className={`${iconSize[size]} text-blue-400`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <Image className={`${iconSize[size]} text-gray-400`} />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
      />
    </div>
  );
};
