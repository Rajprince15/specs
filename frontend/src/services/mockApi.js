// Mock API service for frontend-only mode
import { 
  mockProducts, 
  mockUsers, 
  mockOrders, 
  mockAddresses, 
  mockReviews,
  getMockState,
  setMockState
} from './mockData';

// Helper to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate UUID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Helper to get current timestamp
const now = () => new Date().toISOString();

class MockApiService {
  // Auth endpoints
  async login(email, password) {
    await delay();
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Simple password check (in real mock, you'd want to check passwords properly)
    // For demo purposes, accepting any password for existing users
    const token = 'mock_token_' + generateId();
    setMockState('currentUser', user);
    
    return {
      data: {
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role
        },
        token
      }
    };
  }

  async register(userData) {
    await delay();
    const newUser = {
      id: generateId(),
      ...userData,
      role: 'user',
      is_blocked: 0,
      created_at: now()
    };
    
    mockUsers.push(newUser);
    setMockState('currentUser', newUser);
    const token = 'mock_token_' + generateId();
    
    return {
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          role: newUser.role
        },
        token
      }
    };
  }

  // Products endpoints
  async getProducts(params = {}) {
    await delay();
    const { currentProducts } = getMockState();
    let products = [...currentProducts];

    // Filter by category
    if (params.category && params.category !== 'all') {
      products = products.filter(p => p.category === params.category);
    }

    // Search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by price range
    if (params.min_price) {
      products = products.filter(p => p.price >= params.min_price);
    }
    if (params.max_price) {
      products = products.filter(p => p.price <= params.max_price);
    }

    // Sort
    if (params.sort_by === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (params.sort_by === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (params.sort_by === 'newest') {
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (params.sort_by === 'popular') {
      products.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
    }

    return { data: products };
  }

  async getProduct(id) {
    await delay();
    const { currentProducts } = getMockState();
    const product = currentProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return { data: product };
  }

  async createProduct(productData) {
    await delay();
    const { currentProducts } = getMockState();
    const newProduct = {
      id: generateId(),
      ...productData,
      rating: 0,
      reviews_count: 0,
      created_at: now()
    };
    currentProducts.push(newProduct);
    setMockState('currentProducts', currentProducts);
    return { data: newProduct };
  }

  async updateProduct(id, productData) {
    await delay();
    const { currentProducts } = getMockState();
    const index = currentProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      currentProducts[index] = { ...currentProducts[index], ...productData };
      setMockState('currentProducts', currentProducts);
      return { data: currentProducts[index] };
    }
    throw new Error('Product not found');
  }

  async deleteProduct(id) {
    await delay();
    const { currentProducts } = getMockState();
    const newProducts = currentProducts.filter(p => p.id !== id);
    setMockState('currentProducts', newProducts);
    return { data: { message: 'Product deleted successfully' } };
  }

  async getRecommendedProducts(limit = 8) {
    await delay();
    const { currentProducts } = getMockState();
    // Return top rated products
    const sorted = [...currentProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return { data: sorted.slice(0, limit) };
  }

  async getSearchSuggestions(query) {
    await delay(100);
    const { currentProducts } = getMockState();
    const queryLower = query.toLowerCase();
    
    const products = currentProducts
      .filter(p => p.name.toLowerCase().includes(queryLower))
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.name, type: 'product' }));
    
    const brands = [...new Set(currentProducts
      .filter(p => p.brand.toLowerCase().includes(queryLower))
      .map(p => p.brand))]
      .slice(0, 3)
      .map(brand => ({ name: brand, type: 'brand' }));
    
    const categories = [...new Set(currentProducts
      .filter(p => p.category.toLowerCase().includes(queryLower))
      .map(p => p.category))]
      .slice(0, 3)
      .map(cat => ({ name: cat, type: 'category' }));

    return { data: { products, brands, categories } };
  }

  // Product Images endpoints
  async getProductImages(productId) {
    await delay();
    const { currentProductImages } = getMockState();
    return { data: currentProductImages[productId] || [] };
  }

  async addProductImage(productId, imageData) {
    await delay();
    const { currentProductImages } = getMockState();
    if (!currentProductImages[productId]) {
      currentProductImages[productId] = [];
    }
    const newImage = {
      id: generateId(),
      product_id: productId,
      image_url: imageData.image_url,
      display_order: currentProductImages[productId].length + 1
    };
    currentProductImages[productId].push(newImage);
    setMockState('currentProductImages', currentProductImages);
    return { data: newImage };
  }

  async deleteProductImage(productId, imageId) {
    await delay();
    const { currentProductImages } = getMockState();
    if (currentProductImages[productId]) {
      currentProductImages[productId] = currentProductImages[productId].filter(img => img.id !== imageId);
      setMockState('currentProductImages', currentProductImages);
    }
    return { data: { message: 'Image deleted successfully' } };
  }

  // Cart endpoints
  async getCart() {
    await delay();
    const { currentCart, currentProducts } = getMockState();
    const cartWithProducts = currentCart.map(item => {
      const product = currentProducts.find(p => p.id === item.product_id);
      return {
        ...item,
        product
      };
    });
    return { data: cartWithProducts };
  }

  async addToCart(productId, quantity = 1) {
    await delay();
    const { currentCart } = getMockState();
    const existingItem = currentCart.find(item => item.product_id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.push({
        id: generateId(),
        user_id: '1',
        product_id: productId,
        quantity,
        added_at: now()
      });
    }
    
    setMockState('currentCart', currentCart);
    return { data: { message: 'Product added to cart' } };
  }

  async updateCartItem(itemId, quantity) {
    await delay();
    const { currentCart } = getMockState();
    const item = currentCart.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
    }
    setMockState('currentCart', currentCart);
    return { data: { message: 'Cart updated' } };
  }

  async removeFromCart(itemId) {
    await delay();
    const { currentCart } = getMockState();
    const newCart = currentCart.filter(i => i.id !== itemId);
    setMockState('currentCart', newCart);
    return { data: { message: 'Item removed from cart' } };
  }

  async clearCart() {
    await delay();
    setMockState('currentCart', []);
    return { data: { message: 'Cart cleared' } };
  }

  // Wishlist endpoints
  async getWishlist() {
    await delay();
    const { currentWishlist, currentProducts } = getMockState();
    const wishlistWithProducts = currentWishlist.map(item => {
      const product = currentProducts.find(p => p.id === item.product_id);
      return {
        ...item,
        product
      };
    });
    return { data: wishlistWithProducts };
  }

  async addToWishlist(productId) {
    await delay();
    const { currentWishlist } = getMockState();
    const existingItem = currentWishlist.find(item => item.product_id === productId);
    
    if (!existingItem) {
      currentWishlist.push({
        id: generateId(),
        user_id: '1',
        product_id: productId,
        added_at: now()
      });
    }
    
    setMockState('currentWishlist', currentWishlist);
    return { data: { message: 'Product added to wishlist' } };
  }

  async removeFromWishlist(itemId) {
    await delay();
    const { currentWishlist } = getMockState();
    const newWishlist = currentWishlist.filter(i => i.id !== itemId);
    setMockState('currentWishlist', newWishlist);
    return { data: { message: 'Item removed from wishlist' } };
  }

  // Saved Items endpoints (Save for Later)
  async getSavedItems() {
    await delay();
    const { currentSavedItems, currentProducts } = getMockState();
    const savedItemsWithProducts = currentSavedItems.map(item => {
      const product = currentProducts.find(p => p.id === item.product_id);
      return {
        ...item,
        product
      };
    });
    return { data: savedItemsWithProducts };
  }

  async saveForLater(cartItemId) {
    await delay();
    const { currentCart, currentSavedItems } = getMockState();
    const cartItem = currentCart.find(i => i.id === cartItemId);
    
    if (cartItem) {
      // Move item from cart to saved items
      const savedItem = {
        id: generateId(),
        user_id: '1',
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        saved_at: now()
      };
      
      currentSavedItems.push(savedItem);
      const newCart = currentCart.filter(i => i.id !== cartItemId);
      
      setMockState('currentSavedItems', currentSavedItems);
      setMockState('currentCart', newCart);
    }
    
    return { data: { message: 'Item saved for later' } };
  }

  async moveToCart(savedItemId) {
    await delay();
    const { currentSavedItems, currentCart } = getMockState();
    const savedItem = currentSavedItems.find(i => i.id === savedItemId);
    
    if (savedItem) {
      // Move item from saved items back to cart
      const cartItem = {
        id: generateId(),
        user_id: '1',
        product_id: savedItem.product_id,
        quantity: savedItem.quantity,
        added_at: now()
      };
      
      currentCart.push(cartItem);
      const newSavedItems = currentSavedItems.filter(i => i.id !== savedItemId);
      
      setMockState('currentCart', currentCart);
      setMockState('currentSavedItems', newSavedItems);
    }
    
    return { data: { message: 'Item moved to cart' } };
  }

  async deleteSavedItem(savedItemId) {
    await delay();
    const { currentSavedItems } = getMockState();
    const newSavedItems = currentSavedItems.filter(i => i.id !== savedItemId);
    setMockState('currentSavedItems', newSavedItems);
    return { data: { message: 'Saved item removed' } };
  }


  // Orders endpoints
  async getOrders() {
    await delay();
    const { currentOrders } = getMockState();
    return { data: currentOrders };
  }

  async getOrder(id) {
    await delay();
    const { currentOrders } = getMockState();
    const order = currentOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return { data: order };
  }

  async createOrder(orderData) {
    await delay();
    const { currentOrders, currentCart, currentProducts } = getMockState();
    
    const newOrder = {
      id: generateId(),
      user_id: '1',
      total_amount: orderData.total_amount || 0,
      payment_status: 'pending',
      order_status: 'processing',
      shipping_address: orderData.shipping_address || '',
      created_at: now(),
      updated_at: now(),
      items: currentCart.map(item => {
        const product = currentProducts.find(p => p.id === item.product_id);
        return {
          product_id: item.product_id,
          product_name: product?.name || 'Unknown',
          quantity: item.quantity,
          price: product?.price || 0
        };
      })
    };
    
    currentOrders.unshift(newOrder);
    setMockState('currentOrders', currentOrders);
    setMockState('currentCart', []); // Clear cart after order
    
    return { data: newOrder };
  }

  async getOrderTracking(orderId) {
    await delay();
    const { currentOrders } = getMockState();
    const order = currentOrders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return {
      data: {
        order_id: order.id,
        current_status: order.order_status,
        tracking_number: order.tracking_number || 'TRK' + generateId().substring(0, 12).toUpperCase(),
        estimated_delivery: order.estimated_delivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        history: [
          {
            status: 'processing',
            timestamp: order.created_at,
            description: 'Order placed and payment confirmed'
          }
        ]
      }
    };
  }

  // User profile endpoints
  async getUserProfile() {
    await delay();
    const { currentUser } = getMockState();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    return { data: currentUser };
  }

  async updateUserProfile(profileData) {
    await delay();
    const { currentUser } = getMockState();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const updatedUser = { ...currentUser, ...profileData };
    setMockState('currentUser', updatedUser);
    return { data: updatedUser };
  }

  async updatePassword(passwordData) {
    await delay();
    const { currentUser } = getMockState();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    // In mock mode, just return success
    return { data: { message: 'Password updated successfully' } };
  }

  async getEmailPreferences() {
    await delay();
    const { currentUser } = getMockState();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Return default email preferences
    return { 
      data: {
        email_welcome: true,
        email_order_confirmation: true,
        email_payment_receipt: true,
        email_shipping_notification: true
      }
    };
  }

  async updateEmailPreferences(preferences) {
    await delay();
    const { currentUser } = getMockState();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    // In mock mode, just return the preferences back
    return { data: preferences };
  }

  // Addresses endpoints
  async getAddresses() {
    await delay();
    const { currentAddresses } = getMockState();
    return { data: currentAddresses };
  }

  async addAddress(addressData) {
    await delay();
    const { currentAddresses } = getMockState();
    
    const newAddress = {
      id: generateId(),
      user_id: '1',
      ...addressData,
      created_at: now()
    };
    
    currentAddresses.push(newAddress);
    setMockState('currentAddresses', currentAddresses);
    return { data: newAddress };
  }

  async updateAddress(id, addressData) {
    await delay();
    const { currentAddresses } = getMockState();
    const index = currentAddresses.findIndex(a => a.id === id);
    
    if (index !== -1) {
      currentAddresses[index] = { ...currentAddresses[index], ...addressData };
      setMockState('currentAddresses', currentAddresses);
    }
    
    return { data: currentAddresses[index] };
  }

  async deleteAddress(id) {
    await delay();
    const { currentAddresses } = getMockState();
    const newAddresses = currentAddresses.filter(a => a.id !== id);
    setMockState('currentAddresses', newAddresses);
    return { data: { message: 'Address deleted' } };
  }

  // Reviews endpoints
  async getProductReviews(productId) {
    await delay();
    const { currentReviews } = getMockState();
    const productReviews = currentReviews.filter(r => r.product_id === productId);
    return { data: productReviews };
  }

  async addReview(reviewData) {
    await delay();
    const { currentReviews } = getMockState();
    
    const newReview = {
      id: generateId(),
      user_id: '1',
      user_name: 'John Doe',
      ...reviewData,
      created_at: now()
    };
    
    currentReviews.push(newReview);
    setMockState('currentReviews', currentReviews);
    return { data: newReview };
  }

  // Recently viewed
  async getRecentlyViewed(limit = 6) {
    await delay();
    const { currentRecentlyViewed, currentProducts } = getMockState();
    const productsWithDetails = currentRecentlyViewed
      .slice(0, limit)
      .map(item => {
        const product = currentProducts.find(p => p.id === item.product_id);
        return product;
      })
      .filter(p => p);
    
    return { data: productsWithDetails };
  }

  async addRecentlyViewed(productId) {
    await delay();
    const { currentRecentlyViewed } = getMockState();
    
    // Remove if already exists
    const filtered = currentRecentlyViewed.filter(item => item.product_id !== productId);
    
    // Add to beginning
    filtered.unshift({
      id: generateId(),
      user_id: '1',
      product_id: productId,
      viewed_at: now()
    });
    
    // Keep only last 20
    const limited = filtered.slice(0, 20);
    setMockState('currentRecentlyViewed', limited);
    
    return { data: { message: 'Added to recently viewed' } };
  }

  // Payment endpoints (mock)
  async createCheckoutSession(orderData) {
    await delay();
    // Mock checkout session
    return { 
      data: { 
        session_id: 'mock_session_' + generateId(),
        checkout_url: '/payment-success?mock=true'
      } 
    };
  }

  async getCheckoutStatus(sessionId) {
    await delay();
    return { 
      data: { 
        status: 'completed',
        payment_status: 'paid'
      } 
    };
  }

  // Admin endpoints (simplified)
  async getAdminStats() {
    await delay();
    const { currentProducts, currentOrders } = getMockState();
    return {
      data: {
        total_users: mockUsers.length,
        total_products: currentProducts.length,
        total_orders: currentOrders.length,
        total_revenue: currentOrders.reduce((sum, o) => sum + o.total_amount, 0),
        pending_orders: currentOrders.filter(o => o.order_status === 'processing').length
      }
    };
  }

  async getAllUsers() {
    await delay();
    return { data: mockUsers };
  }

  async updateUserStatus(userId, isBlocked) {
    await delay();
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.is_blocked = isBlocked ? 1 : 0;
    }
    return { data: { message: 'User status updated' } };
  }

  async getAllOrders() {
    await delay();
    const { currentOrders } = getMockState();
    return { data: currentOrders };
  }

  async updateOrderStatus(orderId, status) {
    await delay();
    const { currentOrders } = getMockState();
    const order = currentOrders.find(o => o.id === orderId);
    if (order) {
      order.order_status = status;
      order.updated_at = now();
      setMockState('currentOrders', currentOrders);
    }
    return { data: order };
  }

  async getAllReviews() {
    await delay();
    const { currentReviews } = getMockState();
    return { data: currentReviews };
  }

  async deleteReview(reviewId) {
    await delay();
    const { currentReviews } = getMockState();
    const newReviews = currentReviews.filter(r => r.id !== reviewId);
    setMockState('currentReviews', newReviews);
    return { data: { message: 'Review deleted successfully' } };
  }

  // Coupon management endpoints
  async getCoupons() {
    await delay();
    const { currentCoupons } = getMockState();
    return { data: currentCoupons };
  }

  async createCoupon(couponData) {
    await delay();
    const { currentCoupons } = getMockState();
    const newCoupon = {
      id: generateId(),
      ...couponData,
      used_count: 0,
      created_at: now()
    };
    currentCoupons.push(newCoupon);
    setMockState('currentCoupons', currentCoupons);
    return { data: newCoupon };
  }

  async updateCoupon(id, couponData) {
    await delay();
    const { currentCoupons } = getMockState();
    const index = currentCoupons.findIndex(c => c.id === id);
    if (index !== -1) {
      currentCoupons[index] = { ...currentCoupons[index], ...couponData };
      setMockState('currentCoupons', currentCoupons);
      return { data: currentCoupons[index] };
    }
    throw new Error('Coupon not found');
  }

  async deleteCoupon(id) {
    await delay();
    const { currentCoupons } = getMockState();
    const newCoupons = currentCoupons.filter(c => c.id !== id);
    setMockState('currentCoupons', newCoupons);
    return { data: { message: 'Coupon deleted successfully' } };
  }

  async validateCoupon(code) {
    await delay();
    const { currentCoupons } = getMockState();
    const coupon = currentCoupons.find(c => c.code === code && c.is_active === 1);
    if (!coupon) {
      throw new Error('Invalid or expired coupon');
    }
    return { data: coupon };
  }

  // ==================== COMPREHENSIVE ADMIN ENDPOINTS ====================
  
  // Admin Stats
  async getAdminDashboardStats() {
    await delay();
    const { currentProducts, currentOrders, currentUsers } = getMockState();
    const totalRevenue = currentOrders
      .filter(o => o.payment_status === 'paid' || o.payment_status === 'refunded')
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    return {
      data: {
        total_users: currentUsers.length,
        total_products: currentProducts.length,
        total_orders: currentOrders.length,
        total_revenue: totalRevenue
      }
    };
  }

  // Admin Orders Management
  async updateOrderStatusAdmin(orderId, updateData) {
    await delay();
    const { currentOrders } = getMockState();
    const order = currentOrders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Update order details
    order.order_status = updateData.order_status || order.order_status;
    order.tracking_number = updateData.tracking_number || order.tracking_number;
    order.estimated_delivery = updateData.estimated_delivery || order.estimated_delivery;
    order.updated_at = now();
    
    // Add tracking info if provided
    if (updateData.description || updateData.location) {
      if (!order.tracking) order.tracking = [];
      order.tracking.unshift({
        status: updateData.order_status,
        description: updateData.description || `Order status updated to ${updateData.order_status}`,
        location: updateData.location || 'System',
        created_at: now()
      });
    }
    
    setMockState('currentOrders', currentOrders);
    return { data: order };
  }

  async updateOrderPaymentStatus(orderId, paymentStatus) {
    await delay();
    const { currentOrders } = getMockState();
    const order = currentOrders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.payment_status = paymentStatus;
    order.updated_at = now();
    
    setMockState('currentOrders', currentOrders);
    return { data: { message: 'Payment status updated successfully' } };
  }

  async deleteOrder(orderId) {
    await delay();
    const { currentOrders } = getMockState();
    const newOrders = currentOrders.filter(o => o.id !== orderId);
    setMockState('currentOrders', newOrders);
    return { data: { message: 'Order deleted successfully' } };
  }

  // Admin Payments Management
  async getAdminPayments(params = {}) {
    await delay();
    const { currentPayments } = getMockState();
    const limit = params.limit || 100;
    const offset = params.offset || 0;
    
    return { data: currentPayments.slice(offset, offset + limit) };
  }

  async getPaymentDetails(sessionId) {
    await delay();
    const { currentPayments } = getMockState();
    const payment = currentPayments.find(p => p.session_id === sessionId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    return { data: payment };
  }

  async updatePaymentStatus(sessionId, paymentStatus, status) {
    await delay();
    const { currentPayments } = getMockState();
    const payment = currentPayments.find(p => p.session_id === sessionId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    payment.payment_status = paymentStatus;
    payment.status = status;
    payment.updated_at = now();
    
    setMockState('currentPayments', currentPayments);
    return { data: payment };
  }

  async deletePayment(sessionId) {
    await delay();
    const { currentPayments } = getMockState();
    const newPayments = currentPayments.filter(p => p.session_id !== sessionId);
    setMockState('currentPayments', newPayments);
    return { data: { message: 'Payment deleted successfully' } };
  }

  // Admin Reviews Management
  async getAdminReviews(params = {}) {
    await delay();
    const { currentReviews } = getMockState();
    const limit = params.limit || 100;
    const offset = params.offset || 0;
    
    return { data: currentReviews.slice(offset, offset + limit) };
  }

  async deleteReviewAdmin(reviewId) {
    await delay();
    const { currentReviews } = getMockState();
    const newReviews = currentReviews.filter(r => r.id !== reviewId);
    setMockState('currentReviews', newReviews);
    return { data: { message: 'Review deleted successfully' } };
  }

  // Admin Analytics
  async getAnalyticsSales(params = {}) {
    await delay();
    const { currentAnalytics } = getMockState();
    
    // If date filters provided, filter the daily sales data
    let dailySales = currentAnalytics.sales.daily_sales;
    if (params.start_date) {
      dailySales = dailySales.filter(d => d.date >= params.start_date);
    }
    if (params.end_date) {
      dailySales = dailySales.filter(d => d.date <= params.end_date);
    }
    
    // Recalculate summary based on filtered data
    const summary = {
      total_orders: dailySales.reduce((sum, d) => sum + d.total_orders, 0),
      total_revenue: dailySales.reduce((sum, d) => sum + d.total_revenue, 0),
      average_order_value: 0
    };
    summary.average_order_value = summary.total_orders > 0 
      ? summary.total_revenue / summary.total_orders 
      : 0;
    
    return {
      data: {
        summary,
        daily_sales: dailySales
      }
    };
  }

  async getAnalyticsTopProducts(params = {}) {
    await delay();
    const { currentAnalytics } = getMockState();
    const limit = params.limit || 10;
    
    return { data: { top_products: currentAnalytics.top_products.slice(0, limit) } };
  }

  async getAnalyticsRevenue(params = {}) {
    await delay();
    const { currentAnalytics } = getMockState();
    return { data: currentAnalytics.revenue };
  }

  // Admin Inventory Management
  async getInventoryAlerts() {
    await delay();
    const { currentInventory } = getMockState();
    return { data: currentInventory };
  }

  async updateInventoryThreshold(threshold) {
    await delay();
    const { currentInventory } = getMockState();
    currentInventory.low_stock_threshold = threshold;
    
    // Recalculate alert levels based on new threshold
    currentInventory.alerts = currentInventory.alerts.map(alert => {
      const stock = alert.current_stock;
      let level = 'low';
      if (stock === 0) level = 'critical';
      else if (stock < threshold / 2) level = 'warning';
      return { ...alert, alert_level: level };
    });
    
    setMockState('currentInventory', currentInventory);
    return { data: { message: 'Threshold updated successfully' } };
  }

  async bulkUpdateStock(updates) {
    await delay();
    const { currentProducts, currentInventory } = getMockState();
    
    updates.forEach(update => {
      const product = currentProducts.find(p => p.id === update.product_id);
      if (product) {
        product.stock = update.stock;
      }
      
      // Update inventory alerts
      const alertIndex = currentInventory.alerts.findIndex(a => a.product_id === update.product_id);
      if (alertIndex !== -1) {
        currentInventory.alerts[alertIndex].current_stock = update.stock;
        
        // Update alert level
        const threshold = currentInventory.low_stock_threshold;
        let level = 'low';
        if (update.stock === 0) level = 'critical';
        else if (update.stock < threshold / 2) level = 'warning';
        else if (update.stock >= threshold) {
          // Remove from alerts if stock is above threshold
          currentInventory.alerts.splice(alertIndex, 1);
          return;
        }
        currentInventory.alerts[alertIndex].alert_level = level;
      }
    });
    
    setMockState('currentProducts', currentProducts);
    setMockState('currentInventory', currentInventory);
    return { data: { message: 'Stock updated successfully' } };
  }

  // Admin Users Management
  async getAdminUsers(params = {}) {
    await delay();
    const { currentUsers } = getMockState();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const search = params.search || '';
    
    let filteredUsers = [...currentUsers];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phone.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const users = filteredUsers.slice(offset, offset + limit);
    
    return {
      data: {
        users,
        total,
        pages,
        current_page: page
      }
    };
  }

  async getUserDetails(userId) {
    await delay();
    const { currentUsers, currentOrders, currentReviews, currentCart, currentWishlist } = getMockState();
    const user = currentUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user statistics
    const userOrders = currentOrders.filter(o => o.user_id === userId);
    const userReviews = currentReviews.filter(r => r.user_id === userId);
    const userCart = currentCart.filter(c => c.user_id === userId);
    const userWishlist = currentWishlist.filter(w => w.user_id === userId);
    
    const totalSpent = userOrders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    return {
      data: {
        user,
        statistics: {
          total_orders: userOrders.length,
          total_spent: totalSpent,
          cart_items: userCart.length,
          wishlist_items: userWishlist.length,
          reviews_count: userReviews.length
        },
        recent_orders: userOrders.slice(0, 5)
      }
    };
  }

  async blockUnblockUser(userId) {
    await delay();
    const { currentUsers } = getMockState();
    const user = currentUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.is_blocked = user.is_blocked ? 0 : 1;
    const action = user.is_blocked ? 'blocked' : 'unblocked';
    
    setMockState('currentUsers', currentUsers);
    return { data: { message: `User ${action} successfully` } };
  }

  async deleteUser(userId) {
    await delay();
    const { currentUsers, currentOrders, currentReviews, currentCart, currentWishlist } = getMockState();
    
    // Delete user
    const newUsers = currentUsers.filter(u => u.id !== userId);
    setMockState('currentUsers', newUsers);
    
    // Delete user's orders
    const newOrders = currentOrders.filter(o => o.user_id !== userId);
    setMockState('currentOrders', newOrders);
    
    // Delete user's reviews
    const newReviews = currentReviews.filter(r => r.user_id !== userId);
    setMockState('currentReviews', newReviews);
    
    // Delete user's cart
    const newCart = currentCart.filter(c => c.user_id !== userId);
    setMockState('currentCart', newCart);
    
    // Delete user's wishlist
    const newWishlist = currentWishlist.filter(w => w.user_id !== userId);
    setMockState('currentWishlist', newWishlist);
    
    return { data: { message: 'User and all related data deleted successfully' } };
  }

  async changeUserRole(userId, newRole) {
    await delay();
    const { currentUsers } = getMockState();
    const user = currentUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.role = newRole;
    setMockState('currentUsers', currentUsers);
    return { data: { message: `User role updated to ${newRole}` } };
  }
}

export const mockApiService = new MockApiService();
export default mockApiService;