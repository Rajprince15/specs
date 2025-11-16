import React from 'react';
import { cn } from '@/lib/utils';

const SkipToMain = () => {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-50",
        "focus:top-4 focus:left-4 focus:px-4 focus:py-2",
        "focus:bg-blue-600 focus:text-white focus:rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        "transition-all duration-200"
      )}
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default SkipToMain;
