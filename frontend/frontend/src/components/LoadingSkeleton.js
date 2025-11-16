import React from 'react';

// Base skeleton component
export const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};

// Product card skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
    <Skeleton className="w-full h-48 mb-4" />
    <Skeleton variant="text" className="w-3/4 mb-2" />
    <Skeleton variant="text" className="w-1/2 mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton className="w-24 h-10 rounded-lg" />
    </div>
  </div>
);

// Product detail skeleton
export const ProductDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="grid md:grid-cols-2 gap-8">
      {/* Image skeleton */}
      <div>
        <Skeleton className="w-full h-96 rounded-2xl mb-4" />
        <div className="flex gap-2">
          <Skeleton className="w-20 h-20 rounded-lg" />
          <Skeleton className="w-20 h-20 rounded-lg" />
          <Skeleton className="w-20 h-20 rounded-lg" />
        </div>
      </div>

      {/* Details skeleton */}
      <div className="space-y-4">
        <Skeleton variant="text" className="w-1/4 h-6" />
        <Skeleton variant="text" className="w-3/4 h-8" />
        <Skeleton variant="text" className="w-1/3 h-8" />
        <Skeleton variant="text" className="w-full h-20" />
        
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-full" />
        </div>

        <div className="flex gap-4">
          <Skeleton className="flex-1 h-12 rounded-lg" />
          <Skeleton className="w-12 h-12 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// List skeleton
export const ListSkeleton = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <Skeleton className="w-24 h-8 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="border-b border-gray-200 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4" />
        ))}
      </div>
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-b border-gray-200 p-4 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" className="h-4" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Card skeleton
export const CardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
    <Skeleton variant="text" className="w-1/2 h-6 mb-4" />
    <div className="space-y-3">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <Skeleton variant="text" className="w-1/4 h-4 mb-2" />
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>
    ))}
    <Skeleton className="w-32 h-10 rounded-lg" />
  </div>
);

// Page skeleton (full page loading)
export const PageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Skeleton variant="text" className="w-1/3 h-8 mb-4" />
        <Skeleton variant="text" className="w-2/3 h-6" />
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

export default Skeleton;
