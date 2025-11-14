"""API Response Caching Service with Redis

This module provides caching functionality for API responses:
- Product catalog caching
- User-specific data caching (cart, wishlist, orders)
- Search results caching
- Automatic cache invalidation on mutations
- TTL-based expiration
- Cache warming for frequently accessed data
"""

import redis.asyncio as redis
import hashlib
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import timedelta
import os

logger = logging.getLogger(__name__)

class CacheService:
    """Manages API response caching using Redis"""
    
    def __init__(self, redis_url: str = None):
        """Initialize Redis connection for caching
        
        Args:
            redis_url: Redis connection URL (default: from environment or localhost)
        """
        self.redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379')
        self.redis_client: Optional[redis.Redis] = None
        self.default_ttl = 300  # 5 minutes default TTL
        
    async def connect(self):
        """Establish Redis connection"""
        try:
            self.redis_client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("Redis cache connection established")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis cache: {e}")
            # Don't raise - app should work without cache
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis cache connection closed")
    
    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from prefix and parameters
        
        Args:
            prefix: Key prefix (e.g., 'products', 'cart')
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Cache key string
        """
        # Sort kwargs for consistent key generation
        sorted_kwargs = sorted(kwargs.items())
        key_parts = [prefix] + list(args) + [f"{k}:{v}" for k, v in sorted_kwargs]
        key_string = ":".join(str(p) for p in key_parts)
        
        # Hash if key is too long
        if len(key_string) > 200:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"{prefix}:hash:{key_hash}"
        
        return key_string
    
    # ============ Generic Cache Operations ============
    
    async def get(self, key: str) -> Optional[Any]:
        """Get cached value
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if not self.redis_client:
            return None
            
        try:
            cached = await self.redis_client.get(key)
            if cached:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(cached)
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache get error for {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """Set cached value
        
        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Time to live in seconds (default: 300)
        """
        if not self.redis_client:
            return
            
        try:
            ttl = ttl_seconds or self.default_ttl
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Cache set error for {key}: {e}")
    
    async def delete(self, key: str):
        """Delete cached value
        
        Args:
            key: Cache key
        """
        if not self.redis_client:
            return
            
        try:
            await self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
        except Exception as e:
            logger.error(f"Cache delete error for {key}: {e}")
    
    async def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern
        
        Args:
            pattern: Key pattern (e.g., 'products:*')
        """
        if not self.redis_client:
            return
            
        try:
            cursor = 0
            deleted = 0
            while True:
                cursor, keys = await self.redis_client.scan(
                    cursor,
                    match=pattern,
                    count=100
                )
                if keys:
                    await self.redis_client.delete(*keys)
                    deleted += len(keys)
                if cursor == 0:
                    break
            logger.info(f"Cache DELETE pattern: {pattern} ({deleted} keys)")
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
    
    # ============ Product Caching ============
    
    async def get_products(self, filters: Dict[str, Any]) -> Optional[List[Dict]]:
        """Get cached product list
        
        Args:
            filters: Filter parameters (search, category, price_range, etc.)
            
        Returns:
            Cached product list or None
        """
        key = self._generate_cache_key("products:list", **filters)
        return await self.get(key)
    
    async def set_products(self, filters: Dict[str, Any], products: List[Dict], ttl_seconds: int = 300):
        """Cache product list
        
        Args:
            filters: Filter parameters
            products: Product list to cache
            ttl_seconds: Time to live (default: 5 minutes)
        """
        key = self._generate_cache_key("products:list", **filters)
        await self.set(key, products, ttl_seconds)
    
    async def get_product(self, product_id: str) -> Optional[Dict]:
        """Get cached single product
        
        Args:
            product_id: Product ID
            
        Returns:
            Cached product or None
        """
        key = f"products:detail:{product_id}"
        return await self.get(key)
    
    async def set_product(self, product_id: str, product: Dict, ttl_seconds: int = 600):
        """Cache single product
        
        Args:
            product_id: Product ID
            product: Product data
            ttl_seconds: Time to live (default: 10 minutes)
        """
        key = f"products:detail:{product_id}"
        await self.set(key, product, ttl_seconds)
    
    async def invalidate_products(self):
        """Invalidate all product caches"""
        await self.delete_pattern("products:*")
    
    async def invalidate_product(self, product_id: str):
        """Invalidate specific product and related caches
        
        Args:
            product_id: Product ID
        """
        await self.delete(f"products:detail:{product_id}")
        # Also invalidate product lists since they contain this product
        await self.delete_pattern("products:list:*")
    
    # ============ User-Specific Caching ============
    
    async def get_cart(self, user_id: str) -> Optional[List[Dict]]:
        """Get cached cart
        
        Args:
            user_id: User ID
            
        Returns:
            Cached cart or None
        """
        key = f"cart:{user_id}"
        return await self.get(key)
    
    async def set_cart(self, user_id: str, cart: List[Dict], ttl_seconds: int = 600):
        """Cache user cart
        
        Args:
            user_id: User ID
            cart: Cart data
            ttl_seconds: Time to live (default: 10 minutes)
        """
        key = f"cart:{user_id}"
        await self.set(key, cart, ttl_seconds)
    
    async def invalidate_cart(self, user_id: str):
        """Invalidate user cart cache
        
        Args:
            user_id: User ID
        """
        await self.delete(f"cart:{user_id}")
    
    async def get_wishlist(self, user_id: str) -> Optional[List[Dict]]:
        """Get cached wishlist
        
        Args:
            user_id: User ID
            
        Returns:
            Cached wishlist or None
        """
        key = f"wishlist:{user_id}"
        return await self.get(key)
    
    async def set_wishlist(self, user_id: str, wishlist: List[Dict], ttl_seconds: int = 600):
        """Cache user wishlist
        
        Args:
            user_id: User ID
            wishlist: Wishlist data
            ttl_seconds: Time to live (default: 10 minutes)
        """
        key = f"wishlist:{user_id}"
        await self.set(key, wishlist, ttl_seconds)
    
    async def invalidate_wishlist(self, user_id: str):
        """Invalidate user wishlist cache
        
        Args:
            user_id: User ID
        """
        await self.delete(f"wishlist:{user_id}")
    
    async def get_orders(self, user_id: str) -> Optional[List[Dict]]:
        """Get cached orders
        
        Args:
            user_id: User ID
            
        Returns:
            Cached orders or None
        """
        key = f"orders:{user_id}"
        return await self.get(key)
    
    async def set_orders(self, user_id: str, orders: List[Dict], ttl_seconds: int = 300):
        """Cache user orders
        
        Args:
            user_id: User ID
            orders: Orders data
            ttl_seconds: Time to live (default: 5 minutes)
        """
        key = f"orders:{user_id}"
        await self.set(key, orders, ttl_seconds)
    
    async def invalidate_orders(self, user_id: str):
        """Invalidate user orders cache
        
        Args:
            user_id: User ID
        """
        await self.delete(f"orders:{user_id}")
    
    # ============ Review Caching ============
    
    async def get_reviews(self, product_id: str) -> Optional[List[Dict]]:
        """Get cached product reviews
        
        Args:
            product_id: Product ID
            
        Returns:
            Cached reviews or None
        """
        key = f"reviews:{product_id}"
        return await self.get(key)
    
    async def set_reviews(self, product_id: str, reviews: List[Dict], ttl_seconds: int = 600):
        """Cache product reviews
        
        Args:
            product_id: Product ID
            reviews: Reviews data
            ttl_seconds: Time to live (default: 10 minutes)
        """
        key = f"reviews:{product_id}"
        await self.set(key, reviews, ttl_seconds)
    
    async def invalidate_reviews(self, product_id: str):
        """Invalidate product reviews cache
        
        Args:
            product_id: Product ID
        """
        await self.delete(f"reviews:{product_id}")
    
    # ============ Search Caching ============
    
    async def get_search_suggestions(self, query: str) -> Optional[Dict]:
        """Get cached search suggestions
        
        Args:
            query: Search query
            
        Returns:
            Cached suggestions or None
        """
        key = f"search:suggestions:{query.lower()}"
        return await self.get(key)
    
    async def set_search_suggestions(self, query: str, suggestions: Dict, ttl_seconds: int = 1800):
        """Cache search suggestions
        
        Args:
            query: Search query
            suggestions: Suggestions data
            ttl_seconds: Time to live (default: 30 minutes)
        """
        key = f"search:suggestions:{query.lower()}"
        await self.set(key, suggestions, ttl_seconds)
    
    # ============ Recommended Products Caching ============
    
    async def get_recommended_products(self, user_id: str) -> Optional[List[Dict]]:
        """Get cached recommended products
        
        Args:
            user_id: User ID
            
        Returns:
            Cached recommendations or None
        """
        key = f"recommendations:{user_id}"
        return await self.get(key)
    
    async def set_recommended_products(self, user_id: str, products: List[Dict], ttl_seconds: int = 1800):
        """Cache recommended products
        
        Args:
            user_id: User ID
            products: Recommended products
            ttl_seconds: Time to live (default: 30 minutes)
        """
        key = f"recommendations:{user_id}"
        await self.set(key, products, ttl_seconds)
    
    async def invalidate_recommendations(self, user_id: str):
        """Invalidate user recommendations cache
        
        Args:
            user_id: User ID
        """
        await self.delete(f"recommendations:{user_id}")


# Global cache instance
cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get cache service instance"""
    global cache_service
    if cache_service is None:
        cache_service = CacheService()
    return cache_service
