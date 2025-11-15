/**
 * Google Analytics 4 (GA4) Configuration and Event Tracking
 * 
 * This file provides a comprehensive analytics solution using GA4 for tracking:
 * - Page views
 * - E-commerce events (add_to_cart, purchase, etc.)
 * - Custom events
 * - User interactions
 * 
 * Environment Variables Required:
 * - REACT_APP_GA4_MEASUREMENT_ID: Your GA4 Measurement ID (G-XXXXXXXXXX)
 */

import ReactGA from 'react-ga4';

// Initialize GA4
export const initializeAnalytics = () => {
  const measurementId = process.env.REACT_APP_GA4_MEASUREMENT_ID;
  
  if (measurementId && measurementId !== 'YOUR_GA4_MEASUREMENT_ID') {
    ReactGA.initialize(measurementId, {
      gaOptions: {
        anonymizeIp: true, // Anonymize IP for GDPR compliance
        cookieFlags: 'SameSite=None;Secure', // Cookie security
      },
      gtagOptions: {
        send_page_view: false, // We'll send page views manually
      },
    });
    
    console.log('Google Analytics 4 initialized with ID:', measurementId);
    return true;
  } else {
    console.warn('Google Analytics 4 Measurement ID not configured');
    return false;
  }
};

// Track page views
export const trackPageView = (path, title) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });
  
  console.log('GA4 Page View:', path);
};

// Track custom events
export const trackEvent = (eventName, params = {}) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event(eventName, params);
  console.log('GA4 Event:', eventName, params);
};

// E-commerce Events

/**
 * Track product view
 * @param {Object} product - Product details
 */
export const trackProductView = (product) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('view_item', {
    currency: 'USD',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
  
  console.log('GA4 Product View:', product.name);
};

/**
 * Track add to cart
 * @param {Object} product - Product details
 * @param {Number} quantity - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('add_to_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.category,
        price: product.price,
        quantity: quantity,
      },
    ],
  });
  
  console.log('GA4 Add to Cart:', product.name, 'Qty:', quantity);
};

/**
 * Track remove from cart
 * @param {Object} product - Product details
 * @param {Number} quantity - Quantity removed
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('remove_from_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.category,
        price: product.price,
        quantity: quantity,
      },
    ],
  });
  
  console.log('GA4 Remove from Cart:', product.name);
};

/**
 * Track begin checkout
 * @param {Array} items - Cart items
 * @param {Number} value - Total cart value
 */
export const trackBeginCheckout = (items, value) => {
  if (!isAnalyticsEnabled()) return;
  
  const formattedItems = items.map((item) => ({
    item_id: item.product?.id || item.id,
    item_name: item.product?.name || item.name,
    item_brand: item.product?.brand || item.brand,
    item_category: item.product?.category || item.category,
    price: item.product?.price || item.price,
    quantity: item.quantity,
  }));
  
  ReactGA.event('begin_checkout', {
    currency: 'USD',
    value: value,
    items: formattedItems,
  });
  
  console.log('GA4 Begin Checkout:', value);
};

/**
 * Track purchase
 * @param {Object} orderData - Order details
 */
export const trackPurchase = (orderData) => {
  if (!isAnalyticsEnabled()) return;
  
  const { order_id, total_amount, items, payment_method } = orderData;
  
  const formattedItems = items.map((item) => ({
    item_id: item.product_id,
    item_name: item.product_name,
    item_brand: item.product_brand || 'Unknown',
    item_category: item.product_category || 'Unknown',
    price: item.price,
    quantity: item.quantity,
  }));
  
  ReactGA.event('purchase', {
    transaction_id: order_id,
    currency: 'USD',
    value: total_amount,
    payment_type: payment_method,
    items: formattedItems,
  });
  
  console.log('GA4 Purchase:', order_id, 'Value:', total_amount);
};

/**
 * Track add to wishlist
 * @param {Object} product - Product details
 */
export const trackAddToWishlist = (product) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('add_to_wishlist', {
    currency: 'USD',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
  
  console.log('GA4 Add to Wishlist:', product.name);
};

/**
 * Track search
 * @param {String} searchTerm - Search query
 */
export const trackSearch = (searchTerm) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('search', {
    search_term: searchTerm,
  });
  
  console.log('GA4 Search:', searchTerm);
};

/**
 * Track user registration
 * @param {String} method - Registration method (email, social, etc.)
 */
export const trackSignUp = (method = 'email') => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('sign_up', {
    method: method,
  });
  
  console.log('GA4 Sign Up:', method);
};

/**
 * Track user login
 * @param {String} method - Login method (email, social, etc.)
 */
export const trackLogin = (method = 'email') => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.event('login', {
    method: method,
  });
  
  console.log('GA4 Login:', method);
};

/**
 * Track product list view
 * @param {String} listName - Name of the product list
 * @param {Array} products - Products in the list
 */
export const trackViewItemList = (listName, products) => {
  if (!isAnalyticsEnabled()) return;
  
  const items = products.slice(0, 10).map((product, index) => ({
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand,
    item_category: product.category,
    price: product.price,
    index: index,
  }));
  
  ReactGA.event('view_item_list', {
    item_list_name: listName,
    items: items,
  });
  
  console.log('GA4 View Item List:', listName);
};

/**
 * Track product comparison
 * @param {Array} products - Products being compared
 */
export const trackProductComparison = (products) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('compare_products', {
    product_count: products.length,
    product_ids: products.map((p) => p.id).join(','),
  });
  
  console.log('GA4 Product Comparison:', products.length, 'products');
};

/**
 * Track review submission
 * @param {String} productId - Product ID
 * @param {Number} rating - Review rating
 */
export const trackReviewSubmit = (productId, rating) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('submit_review', {
    product_id: productId,
    rating: rating,
  });
  
  console.log('GA4 Submit Review:', productId, 'Rating:', rating);
};

/**
 * Track coupon application
 * @param {String} couponCode - Coupon code applied
 * @param {Number} discountAmount - Discount amount
 */
export const trackApplyCoupon = (couponCode, discountAmount) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('apply_coupon', {
    coupon_code: couponCode,
    discount_amount: discountAmount,
  });
  
  console.log('GA4 Apply Coupon:', couponCode);
};

/**
 * Track order tracking view
 * @param {String} orderId - Order ID
 * @param {String} status - Current order status
 */
export const trackOrderTracking = (orderId, status) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('track_order', {
    order_id: orderId,
    order_status: status,
  });
  
  console.log('GA4 Track Order:', orderId, 'Status:', status);
};

/**
 * Track filter usage
 * @param {Object} filters - Applied filters
 */
export const trackFilterApply = (filters) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('apply_filter', {
    ...filters,
  });
  
  console.log('GA4 Apply Filter:', filters);
};

/**
 * Track sort usage
 * @param {String} sortBy - Sort criteria
 */
export const trackSortApply = (sortBy) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('apply_sort', {
    sort_by: sortBy,
  });
  
  console.log('GA4 Apply Sort:', sortBy);
};

// Utility Functions

/**
 * Check if analytics is enabled
 * @returns {Boolean}
 */
const isAnalyticsEnabled = () => {
  const measurementId = process.env.REACT_APP_GA4_MEASUREMENT_ID;
  return measurementId && measurementId !== 'YOUR_GA4_MEASUREMENT_ID';
};

/**
 * Set user properties
 * @param {Object} properties - User properties
 */
export const setUserProperties = (properties) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.set(properties);
  console.log('GA4 User Properties Set:', properties);
};

/**
 * Set user ID for tracking
 * @param {String} userId - User ID
 */
export const setUserId = (userId) => {
  if (!isAnalyticsEnabled()) return;
  
  ReactGA.set({ userId: userId });
  console.log('GA4 User ID Set:', userId);
};

export default {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackAddToWishlist,
  trackSearch,
  trackSignUp,
  trackLogin,
  trackViewItemList,
  trackProductComparison,
  trackReviewSubmit,
  trackApplyCoupon,
  trackOrderTracking,
  trackFilterApply,
  trackSortApply,
  setUserProperties,
  setUserId,
};
