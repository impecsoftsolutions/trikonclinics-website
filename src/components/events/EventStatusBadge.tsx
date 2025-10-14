import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';

interface EventStatusBadgeProps {
  status: 'draft' | 'published';
  size?: 'sm' | 'md';
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (status === 'published') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium text-green-700 bg-green-100 rounded-full ${sizeClasses}`}>
        <CheckCircle className={iconSize} />
        Published
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium text-gray-700 bg-gray-100 rounded-full ${sizeClasses}`}>
      <FileText className={iconSize} />
      Draft
    </span>
  );
};
