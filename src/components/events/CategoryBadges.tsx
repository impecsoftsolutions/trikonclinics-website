import React from 'react';
import { Tag } from 'lucide-react';

interface CategoryBadgesProps {
  tags: Array<{ id: string; tag_name: string; slug: string }>;
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export const CategoryBadges: React.FC<CategoryBadgesProps> = ({ tags, maxVisible = 3, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (!tags || tags.length === 0) {
    return (
      <span className="text-sm text-gray-400 italic">No categories</span>
    );
  }

  const visibleCategories = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visibleCategories.map((category) => (
        <span
          key={category.id}
          className={`inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-100 rounded-full ${sizeClasses}`}
        >
          <Tag className={iconSize} />
          {category.tag_name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className={`inline-flex items-center font-medium text-gray-600 bg-gray-100 rounded-full ${sizeClasses}`}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};
