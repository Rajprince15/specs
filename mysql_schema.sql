-- ==================================================================
-- LensKart E-Commerce MySQL Database Schema
-- ==================================================================
-- This schema is designed to replace MongoDB with MySQL
-- All IDs are UUIDs (CHAR(36)) for consistency with the existing app
-- Database: specs
-- ==================================================================

-- Use the specs database
USE specs;

-- Drop existing tables if they exist (use with caution in production)
DROP TABLE IF EXISTS saved_items;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS recently_viewed;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ==================================================================
-- USERS TABLE
-- ==================================================================
-- Stores user account information
-- Fixed admin: admin@lenskart.com / Admin@123 (not stored in DB)
-- ==================================================================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    role ENUM('user', 'admin') DEFAULT 'user',
    email_welcome TINYINT DEFAULT 1 COMMENT 'Email preference: Welcome emails',
    email_order_confirmation TINYINT DEFAULT 1 COMMENT 'Email preference: Order confirmation emails',
    email_payment_receipt TINYINT DEFAULT 1 COMMENT 'Email preference: Payment receipt emails',
    email_shipping_notification TINYINT DEFAULT 1 COMMENT 'Email preference: Shipping notification emails',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- PRODUCTS TABLE
-- ==================================================================
-- Stores eyewear product catalog
-- ==================================================================
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category ENUM('men', 'women', 'kids', 'sunglasses') NOT NULL,
    frame_type ENUM('full-rim', 'half-rim', 'rimless') NOT NULL,
    frame_shape ENUM('rectangular', 'round', 'cat-eye', 'aviator', 'wayfarer', 'square', 'oval') NOT NULL,
    color VARCHAR(50) NOT NULL,
    image_url VARCHAR(500),
    stock INT DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_brand (brand),
    INDEX idx_price (price),
    INDEX idx_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- CART TABLE
-- ==================================================================
-- Stores shopping cart items for each user
-- ==================================================================
CREATE TABLE cart (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- ORDERS TABLE
-- ==================================================================
-- Stores order header information
-- ==================================================================
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    order_status ENUM('processing', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
    shipping_address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- ORDER ITEMS TABLE
-- ==================================================================
-- Stores individual items in each order
-- Note: In MongoDB, items were stored as an array in the orders collection
-- In MySQL, we normalize this into a separate table
-- ==================================================================
CREATE TABLE order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL COMMENT 'Snapshot of product name at time of order',
    product_brand VARCHAR(100) NOT NULL COMMENT 'Snapshot of brand at time of order',
    product_price DECIMAL(10, 2) NOT NULL COMMENT 'Snapshot of price at time of order',
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL COMMENT 'price * quantity',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- PAYMENT TRANSACTIONS TABLE
-- ==================================================================
-- Stores Stripe payment transaction details
-- ==================================================================
CREATE TABLE payment_transactions (
    id CHAR(36) PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Stripe session ID',
    user_id CHAR(36),
    order_id CHAR(36),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    payment_status ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'initiated' COMMENT 'Transaction lifecycle status',
    metadata JSON COMMENT 'Additional Stripe metadata',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- ADDRESSES TABLE
-- ==================================================================
-- Stores user shipping/billing addresses
-- ==================================================================
CREATE TABLE addresses (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    label ENUM('Home', 'Work', 'Other') NOT NULL,
    full_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    is_default TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- REVIEWS TABLE
-- ==================================================================
-- Stores product reviews and ratings
-- ==================================================================
CREATE TABLE reviews (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_review (user_id, product_id),
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- WISHLIST TABLE
-- ==================================================================
-- Stores user's wishlist items
-- ==================================================================
CREATE TABLE wishlist (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_wishlist (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- PRODUCT_IMAGES TABLE
-- ==================================================================
-- Stores multiple images for each product
-- ==================================================================
CREATE TABLE product_images (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    is_primary TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_display_order (display_order),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- RECENTLY_VIEWED TABLE
-- ==================================================================
-- Tracks user's recently viewed products for recommendations
-- ==================================================================
CREATE TABLE recently_viewed (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_view (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- COUPONS TABLE
-- ==================================================================
-- Stores discount coupon codes and their details
-- ==================================================================
CREATE TABLE coupons (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2) NULL COMMENT 'Maximum discount for percentage coupons',
    usage_limit INT NULL COMMENT 'NULL = unlimited',
    used_count INT DEFAULT 0,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_valid_until (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- SAVED_ITEMS TABLE
-- ==================================================================
-- Stores items saved for later by users
-- ==================================================================
CREATE TABLE saved_items (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT DEFAULT 1,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_saved (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- SAMPLE DATA - 10 Products (Same as MongoDB seed data)
-- ==================================================================

INSERT INTO products (id, name, brand, price, description, category, frame_type, frame_shape, color, image_url, stock) VALUES
('prod-001', 'Classic Aviator Sunglasses', 'Ray-Ban', 149.99, 'Iconic aviator style with polarized lenses', 'sunglasses', 'full-rim', 'aviator', 'Gold', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500', 50),
('prod-002', 'Modern Rectangular Frames', 'Oakley', 199.99, 'Sleek rectangular frames for everyday wear', 'men', 'full-rim', 'rectangular', 'Black', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500', 75),
('prod-003', 'Cat-Eye Fashion Glasses', 'Prada', 299.99, 'Stylish cat-eye frames perfect for fashion-forward women', 'women', 'full-rim', 'cat-eye', 'Tortoise', 'https://images.unsplash.com/photo-1551621852-22f5f7a29d1e?w=500', 30),
('prod-004', 'Kids Fun Frames', 'Disney', 79.99, 'Durable and colorful frames for active kids', 'kids', 'full-rim', 'round', 'Blue', 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=500', 100),
('prod-005', 'Rimless Executive', 'Silhouette', 349.99, 'Professional rimless design for executives', 'men', 'rimless', 'rectangular', 'Silver', 'https://images.unsplash.com/photo-1586431461229-b9457ec58a1c?w=500', 40),
('prod-006', 'Round Vintage Specs', 'Warby Parker', 129.99, 'Retro round frames with modern comfort', 'women', 'full-rim', 'round', 'Brown', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', 60),
('prod-007', 'Sports Performance Sunglasses', 'Nike', 179.99, 'High-performance sports eyewear with UV protection', 'sunglasses', 'half-rim', 'rectangular', 'Red', 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=500', 45),
('prod-008', 'Designer Wayfarer', 'Gucci', 399.99, 'Luxury wayfarer style with signature details', 'women', 'full-rim', 'wayfarer', 'Black', 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500', 25),
('prod-009', 'Kids Safety Glasses', 'SafeView', 59.99, 'Impact-resistant frames for child safety', 'kids', 'full-rim', 'oval', 'Pink', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500', 80),
('prod-010', 'Half-Rim Professional', 'Persol', 249.99, 'Elegant half-rim design for professionals', 'men', 'half-rim', 'rectangular', 'Gunmetal', 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=500', 55);

-- ==================================================================
-- USEFUL QUERIES FOR REFERENCE
-- ==================================================================

-- Get user's cart with product details:
-- SELECT c.*, p.name, p.brand, p.price, p.image_url, p.stock 
-- FROM cart c 
-- JOIN products p ON c.product_id = p.id 
-- WHERE c.user_id = ?;

-- Get order with all items:
-- SELECT o.*, oi.product_name, oi.product_brand, oi.product_price, oi.quantity, oi.subtotal
-- FROM orders o
-- LEFT JOIN order_items oi ON o.id = oi.order_id
-- WHERE o.id = ?;

-- Admin statistics:
-- SELECT 
--   (SELECT COUNT(*) FROM products) as total_products,
--   (SELECT COUNT(*) FROM orders) as total_orders,
--   (SELECT COUNT(*) FROM users WHERE role='user') as total_users,
--   (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status='paid') as total_revenue;

-- ==================================================================
-- END OF SCHEMA
-- ==================================================================

