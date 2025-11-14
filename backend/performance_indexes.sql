-- ========================================================
-- Performance Optimization Indexes
-- ========================================================
-- Additional composite indexes for common query patterns
-- Run these after the main mysql_schema.sql
-- ========================================================

USE specs;

-- ============ Product Search Optimization ============

-- Composite index for category + price filtering (very common)
CREATE INDEX IF NOT EXISTS idx_products_category_price 
ON products(category, price);

-- Composite index for category + stock (for available products by category)
CREATE INDEX IF NOT EXISTS idx_products_category_stock 
ON products(category, stock);

-- Composite index for brand + stock (for available products by brand)
CREATE INDEX IF NOT EXISTS idx_products_brand_stock 
ON products(brand, stock);

-- Full-text index for product search (name, brand, description)
-- Note: MySQL full-text indexes can significantly speed up LIKE queries
ALTER TABLE products 
ADD FULLTEXT INDEX idx_products_search (name, brand, description);

-- ============ Cart Query Optimization ============

-- Composite index for cart operations by user
CREATE INDEX IF NOT EXISTS idx_cart_user_product 
ON cart(user_id, product_id);

-- ============ Order Query Optimization ============

-- Composite index for order listing by user and status
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, order_status);

-- Composite index for order listing by user and date
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
ON orders(user_id, created_at DESC);

-- Composite index for admin order queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(order_status, created_at DESC);

-- ============ Review Query Optimization ============

-- Composite index for product reviews with rating
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating 
ON reviews(product_id, rating);

-- ============ Analytics Query Optimization ============

-- Composite index for payment analytics
CREATE INDEX IF NOT EXISTS idx_payment_status_created 
ON payment_transactions(payment_status, created_at);

-- Composite index for order analytics by date
CREATE INDEX IF NOT EXISTS idx_orders_payment_created 
ON orders(payment_status, created_at DESC);

-- ============ Recently Viewed Optimization ============

-- Composite index for recently viewed with timestamp
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_time 
ON recently_viewed(user_id, viewed_at DESC);

-- ============ Coupon Validation Optimization ============

-- Composite index for active coupon lookup
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates 
ON coupons(is_active, valid_from, valid_until);

-- ========================================================
-- Query Optimization Notes:
-- ========================================================
-- 1. These indexes target the most common query patterns
-- 2. Composite indexes follow the "leftmost prefix" rule
-- 3. Full-text index significantly improves product search
-- 4. Monitor index usage with: 
--    SHOW INDEX FROM table_name;
--    EXPLAIN SELECT ... (to see which indexes are used)
-- 5. Regularly analyze tables with: ANALYZE TABLE table_name;
-- ========================================================

-- Analyze tables to update statistics
ANALYZE TABLE users;
ANALYZE TABLE products;
ANALYZE TABLE cart;
ANALYZE TABLE orders;
ANALYZE TABLE order_items;
ANALYZE TABLE payment_transactions;
ANALYZE TABLE reviews;
ANALYZE TABLE wishlist;
ANALYZE TABLE recently_viewed;
ANALYZE TABLE coupons;

SELECT 'Performance indexes created successfully!' AS Status;
