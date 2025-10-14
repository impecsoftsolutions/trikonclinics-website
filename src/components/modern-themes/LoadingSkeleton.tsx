import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex gap-2 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <div className="h-9 bg-gray-200 rounded flex-1"></div>
            <div className="h-9 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
