/**
 * usePageTracking Hook
 * 
 * Automatically tracks page views when route changes
 * Usage: Add this hook to your App.js or router component
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
};

export default usePageTracking;
