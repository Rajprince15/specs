import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LazyImage from '@/components/LazyImage';

/**
 * Memoized Product Card Component
 * Prevents unnecessary re-renders when parent updates
 * Used in product grids and listings
 */
const ProductCard = memo(({ 
  product, 
  onAddToCart, 
  onAddToWishlist,
  onToggleCompare,
  isInWishlist = false,
  isInCompare = false,
  showCompare = false 
}) => {
  // Stock badge logic
  const getStockBadge = () => {
    if (product.stock === 0) {
      return (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          Out of Stock
        </span>
      );
    }
    if (product.stock < 10) {
      return (
        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          Only {product.stock} left
        </span>
      );
    }
    return (
      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
        In Stock
      </span>
    );
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Stock Badge */}
      {getStockBadge()}
      
      {/* Compare Checkbox (if enabled) */}
      {showCompare && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isInCompare}
            onChange={() => onToggleCompare(product.id)}
            className="w-4 h-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Product Image */}
      <Link to={`/products/${product.id}`}>
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <LazyImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            placeholderClassName="rounded-t-xl"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-sm text-gray-500 font-medium mb-1">{product.brand}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-3">
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ${product.price}
          </p>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToWishlist && onAddToWishlist(product.id);
              }}
              className={`p-2 rounded-full transition-colors ${
                isInWishlist
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
              }`}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            onAddToCart && onAddToCart(product.id);
          }}
          disabled={product.stock === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these props change
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.isInWishlist === nextProps.isInWishlist &&
    prevProps.isInCompare === nextProps.isInCompare &&
    prevProps.showCompare === nextProps.showCompare
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
