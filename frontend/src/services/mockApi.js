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
}

export const mockApiService = new MockApiService();
export default mockApiService;