import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, ShoppingCart, Heart, Package, Trash2, X } from 'lucide-react';

/**
 * Enhanced Toast Component with Product Images
 * Can be used with sonner's custom toast
 */
export const ProductAddedToast = ({ product, action = 'cart' }) => {
  const actionConfig = {
    cart: {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: 'Added to Cart',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    wishlist: {
      icon: <Heart className="w-5 h-5" />,
      title: 'Added to Wishlist',
      bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    removed: {
      icon: <Trash2 className="w-5 h-5" />,
      title: 'Removed',
      bgColor: 'bg-gradient-to-r from-red-500 to-orange-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    order: {
      icon: <Package className="w-5 h-5" />,
      title: 'Order Placed',
      bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  };

  const config = actionConfig[action] || actionConfig.cart;

  return (
    <div className="flex items-center gap-3 p-2 min-w-[320px] max-w-[400px]">
      {/* Product Image */}
      {product?.image_url && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shadow-md">
          <img
            src={product.image_url}
            alt={product.name || 'Product'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`${config.iconBg} ${config.iconColor} p-1.5 rounded-full`}>
            {config.icon}
          </div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            {config.title}
          </h4>
        </div>
        
        {product?.name && (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1 font-medium">
            {product.name}
          </p>
        )}
        
        {product?.price && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            ₹{product.price.toFixed(2)}
          </p>
        )}
        
        {product?.quantity && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Qty: {product.quantity}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Success Toast with Icon
 */
export const SuccessToast = ({ title, message, icon }) => {
  return (
    <div className="flex items-start gap-3 p-2 min-w-[280px]">
      <div className="bg-green-100 text-green-600 p-2 rounded-full flex-shrink-0">
        {icon || <CheckCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">
          {title}
        </h4>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Error Toast with Icon
 */
export const ErrorToast = ({ title, message, icon }) => {
  return (
    <div className="flex items-start gap-3 p-2 min-w-[280px]">
      <div className="bg-red-100 text-red-600 p-2 rounded-full flex-shrink-0">
        {icon || <AlertCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">
          {title}
        </h4>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Warning Toast with Icon
 */
export const WarningToast = ({ title, message, icon }) => {
  return (
    <div className="flex items-start gap-3 p-2 min-w-[280px]">
      <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full flex-shrink-0">
        {icon || <AlertTriangle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">
          {title}
        </h4>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Info Toast with Icon
 */
export const InfoToast = ({ title, message, icon }) => {
  return (
    <div className="flex items-start gap-3 p-2 min-w-[280px]">
      <div className="bg-blue-100 text-blue-600 p-2 rounded-full flex-shrink-0">
        {icon || <Info className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">
          {title}
        </h4>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default {
  ProductAddedToast,
  SuccessToast,
  ErrorToast,
  WarningToast,
  InfoToast
};
