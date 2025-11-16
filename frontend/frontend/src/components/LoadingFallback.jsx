import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-purple-600 mb-4"></div>
        
        {/* Loading text */}
        <p className="text-gray-600 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(LoadingFallback);
