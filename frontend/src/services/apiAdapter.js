// API Adapter - automatically uses mock data when backend is unavailable
import axios from 'axios';
import mockApiService from './mockApi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Check if we should use mock mode
// Mock mode is enabled when REACT_APP_USE_MOCK is 'true' or backend is not available
const USE_MOCK_MODE = process.env.REACT_APP_USE_MOCK === 'true';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API,
  timeout: 5000, // 5 second timeout
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend availability checker
let backendAvailable = !USE_MOCK_MODE;
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 10000; // Check every 10 seconds

async function checkBackendAvailability() {
  if (USE_MOCK_MODE) return false;
  
  const now = Date.now();
  if (now - lastBackendCheck < BACKEND_CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  try {
    lastBackendCheck = now;
    await axios.get(`${BACKEND_URL}/api/products`, { timeout: 2000 });
    backendAvailable = true;
    return true;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
}

// API Adapter class
class ApiAdapter {
  constructor() {
    this.useMock = USE_MOCK_MODE;
    
    // Initialize by checking backend availability
    if (!USE_MOCK_MODE) {
      checkBackendAvailability().then(available => {
        this.useMock = !available;
        if (!available) {
          console.log('🔄 Backend not available, using mock data');
        }
      });
    } else {
      console.log('🎭 Mock mode enabled via environment variable');
    }
  }

  async request(method, url, data = null, config = {}) {
    // If explicitly using mock mode, use mock API
    if (this.useMock) {
      return this.handleMockRequest(method, url, data);
    }

    // Try real API first
    try {
      let response;
      if (method === 'GET') {
        response = await axiosInstance.get(url, config);
      } else if (method === 'POST') {
        response = await axiosInstance.post(url, data, config);
      } else if (method === 'PUT') {
        response = await axiosInstance.put(url, data, config);
      } else if (method === 'PATCH') {
        response = await axiosInstance.patch(url, data, config);
      } else if (method === 'DELETE') {
        response = await axiosInstance.delete(url, config);
      }
      
      // Backend is working
      backendAvailable = true;
      return response;
    } catch (error) {
      // If network error or timeout, fallback to mock
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log(`⚠️ Backend request failed, using mock data for: ${url}`);
        this.useMock = true; // Switch to mock mode
        return this.handleMockRequest(method, url, data);
      }
      
      // For other errors (401, 404, etc.), throw them
      throw error;
    }
  }

  handleMockRequest(method, url, data) {
    // Remove leading slash and query params for routing
    const cleanUrl = url.split('?')[0].replace(/^\//, '');
    const queryString = url.includes('?') ? url.split('?')[1] : '';
    const params = Object.fromEntries(new URLSearchParams(queryString));

    // Route to appropriate mock API method
    try {
      // Auth routes
      if (cleanUrl === 'auth/login' && method === 'POST') {
        return mockApiService.login(data.email, data.password);
      }
      if (cleanUrl === 'auth/register' && method === 'POST') {
        return mockApiService.register(data);
      }

      // Products routes
      if (cleanUrl === 'products' && method === 'GET') {
        return mockApiService.getProducts(params);
      }
      if (cleanUrl === 'products' && method === 'POST') {
        return mockApiService.createProduct(data);
      }
      if (cleanUrl.match(/^products\/[^/]+$/) && method === 'GET') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.getProduct(id);
      }
      if (cleanUrl.match(/^products\/[^/]+$/) && method === 'PUT') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.updateProduct(id, data);
      }
      if (cleanUrl.match(/^products\/[^/]+$/) && method === 'DELETE') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.deleteProduct(id);
      }
      if (cleanUrl === 'products/recommended' && method === 'GET') {
        return mockApiService.getRecommendedProducts(params.limit || 8);
      }
      if (cleanUrl === 'search/suggestions' && method === 'GET') {
        return mockApiService.getSearchSuggestions(params.q || '');
      }

      // Product Images routes
      if (cleanUrl.match(/^products\/[^/]+\/images$/) && method === 'GET') {
        const productId = cleanUrl.split('/')[1];
        return mockApiService.getProductImages(productId);
      }
      if (cleanUrl.match(/^products\/[^/]+\/images$/) && method === 'POST') {
        const productId = cleanUrl.split('/')[1];
        return mockApiService.addProductImage(productId, data);
      }
      if (cleanUrl.match(/^products\/[^/]+\/images\/[^/]+$/) && method === 'DELETE') {
        const parts = cleanUrl.split('/');
        const productId = parts[1];
        const imageId = parts[3];
        return mockApiService.deleteProductImage(productId, imageId);
      }

      // Cart routes
      if (cleanUrl === 'cart' && method === 'GET') {
        return mockApiService.getCart();
      }
      if (cleanUrl === 'cart' && method === 'POST') {
        return mockApiService.addToCart(data.product_id, data.quantity);
      }
      if (cleanUrl.match(/^cart\/[^/]+$/) && method === 'PUT') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.updateCartItem(id, data.quantity);
      }
      if (cleanUrl.match(/^cart\/[^/]+$/) && method === 'DELETE') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.removeFromCart(id);
      }
      if (cleanUrl === 'cart/clear' && method === 'POST') {
        return mockApiService.clearCart();
      }

      // Wishlist routes
      if (cleanUrl === 'wishlist' && method === 'GET') {
        return mockApiService.getWishlist();
      }
      if (cleanUrl === 'wishlist' && method === 'POST') {
        return mockApiService.addToWishlist(data.product_id);
      }
      if (cleanUrl.match(/^wishlist\/[^/]+$/) && method === 'DELETE') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.removeFromWishlist(id);
      }

      // Orders routes
      if (cleanUrl === 'orders' && method === 'GET') {
        return mockApiService.getOrders();
      }
      if (cleanUrl === 'orders' && method === 'POST') {
        return mockApiService.createOrder(data);
      }
      if (cleanUrl.match(/^orders\/[^/]+$/) && method === 'GET') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.getOrder(id);
      }

      // User profile routes
      if (cleanUrl === 'user/profile' && method === 'GET') {
        return mockApiService.getUserProfile();
      }
      if (cleanUrl === 'user/profile' && method === 'PUT') {
        return mockApiService.updateUserProfile(data);
      }

      // Addresses routes
      if (cleanUrl === 'addresses' && method === 'GET') {
        return mockApiService.getAddresses();
      }
      if (cleanUrl === 'addresses' && method === 'POST') {
        return mockApiService.addAddress(data);
      }
      if (cleanUrl.match(/^addresses\/[^/]+$/) && method === 'PUT') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.updateAddress(id, data);
      }
      if (cleanUrl.match(/^addresses\/[^/]+$/) && method === 'DELETE') {
        const id = cleanUrl.split('/')[1];
        return mockApiService.deleteAddress(id);
      }

      // Reviews routes
      if (cleanUrl.match(/^products\/[^/]+\/reviews$/) && method === 'GET') {
        const productId = cleanUrl.split('/')[1];
        return mockApiService.getProductReviews(productId);
      }
      if (cleanUrl === 'reviews' && method === 'POST') {
        return mockApiService.addReview(data);
      }

      // Recently viewed
      if (cleanUrl === 'user/recently-viewed' && method === 'GET') {
        return mockApiService.getRecentlyViewed(params.limit || 6);
      }
      if (cleanUrl === 'user/recently-viewed' && method === 'POST') {
        return mockApiService.addRecentlyViewed(data.product_id);
      }

      // Payment routes
      if (cleanUrl === 'payment/create-checkout-session' && method === 'POST') {
        return mockApiService.createCheckoutSession(data);
      }
      if (cleanUrl.match(/^payment\/checkout-status\//) && method === 'GET') {
        const sessionId = cleanUrl.split('/').pop();
        return mockApiService.getCheckoutStatus(sessionId);
      }

      // Admin routes
      if (cleanUrl === 'admin/stats' && method === 'GET') {
        return mockApiService.getAdminStats();
      }
      if (cleanUrl === 'admin/users' && method === 'GET') {
        return mockApiService.getAllUsers();
      }
      if (cleanUrl.match(/^admin\/users\/[^/]+$/) && method === 'PATCH') {
        const userId = cleanUrl.split('/')[2];
        return mockApiService.updateUserStatus(userId, data.is_blocked);
      }
      if (cleanUrl === 'admin/orders' && method === 'GET') {
        return mockApiService.getAllOrders();
      }
      if (cleanUrl.match(/^admin\/orders\/[^/]+$/) && method === 'PATCH') {
        const orderId = cleanUrl.split('/')[2];
        return mockApiService.updateOrderStatus(orderId, data.order_status);
      }
      if (cleanUrl === 'admin/reviews' && method === 'GET') {
        return mockApiService.getAllReviews();
      }
      if (cleanUrl.match(/^admin\/reviews\/[^/]+$/) && method === 'DELETE') {
        const reviewId = cleanUrl.split('/')[2];
        return mockApiService.deleteReview(reviewId);
      }
      if (cleanUrl === 'admin/coupons' && method === 'GET') {
        return mockApiService.getCoupons();
      }
      if (cleanUrl === 'admin/coupons' && method === 'POST') {
        return mockApiService.createCoupon(data);
      }
      if (cleanUrl.match(/^admin\/coupons\/[^/]+$/) && method === 'PUT') {
        const couponId = cleanUrl.split('/')[2];
        return mockApiService.updateCoupon(couponId, data);
      }
      if (cleanUrl.match(/^admin\/coupons\/[^/]+$/) && method === 'DELETE') {
        const couponId = cleanUrl.split('/')[2];
        return mockApiService.deleteCoupon(couponId);
      }
      if (cleanUrl === 'coupons/validate' && method === 'POST') {
        return mockApiService.validateCoupon(data.code);
      }

      // Default fallback
      console.warn(`No mock handler for: ${method} ${cleanUrl}`);
      return Promise.resolve({ data: [] });
    } catch (error) {
      console.error('Mock API error:', error);
      return Promise.reject(error);
    }
  }

  // Convenience methods
  get(url, config) {
    return this.request('GET', url, null, config);
  }

  post(url, data, config) {
    return this.request('POST', url, data, config);
  }

  put(url, data, config) {
    return this.request('PUT', url, data, config);
  }

  patch(url, data, config) {
    return this.request('PATCH', url, data, config);
  }

  delete(url, config) {
    return this.request('DELETE', url, null, config);
  }

  // Toggle mock mode manually
  setMockMode(enabled) {
    this.useMock = enabled;
    console.log(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Check if currently using mock mode
  isMockMode() {
    return this.useMock;
  }
}

// Export singleton instance
export const apiAdapter = new ApiAdapter();
export default apiAdapter;

// Also export the original axios instance for backward compatibility
export { axiosInstance };
