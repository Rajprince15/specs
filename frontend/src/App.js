import { useState, useEffect, lazy, Suspense } from "react";
import "@/App.css";
import "@/styles/accessibility.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import LoadingFallback from "@/components/LoadingFallback";
import SkipToMain from "@/components/SkipToMain";
import InstallPrompt from "@/components/InstallPrompt";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/context/ThemeContext";
import "@/i18n"; // Initialize i18n
import { initializeAnalytics, setUserId } from "@/utils/analytics";
import usePageTracking from "@/hooks/usePageTracking";
import { apiAdapter } from "@/services/apiAdapter";

// Eager load critical pages (landing, login, register)
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Lazy load less critical pages
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const SavedItems = lazy(() => import("@/pages/SavedItems"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const Profile = lazy(() => import("@/pages/Profile"));
const Addresses = lazy(() => import("@/pages/Addresses"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const Compare = lazy(() => import("@/pages/Compare"));

// Lazy load admin pages (heavy and used by few users)
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Users = lazy(() => import("@/pages/Users"));
const AdminOrders = lazy(() => import("@/pages/AdminOrders"));
const AdminPayments = lazy(() => import("@/pages/AdminPayments"));
const AdminReviews = lazy(() => import("@/pages/AdminReviews"));

// Export apiAdapter as axiosInstance for backward compatibility
// This allows existing code to work without changes
export const axiosInstance = apiAdapter;

function App() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [savedItemsCount, setSavedItemsCount] = useState(0);

  // Initialize Google Analytics 4
  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Set user ID for analytics tracking
      if (parsedUser.id) {
        setUserId(parsedUser.id);
      }
      
      fetchCartCount();
      fetchWishlistCount();
      fetchSavedItemsCount();
    }
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await apiAdapter.get("/cart");
      const count = response.data.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      setCartCount(count);
    } catch (error) {
      console.error("Failed to fetch cart count");
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await apiAdapter.get("/wishlist");
      setWishlistCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch wishlist count");
    }
  };

  const fetchSavedItemsCount = async () => {
    try {
      const response = await apiAdapter.get("/saved-items");
      setSavedItemsCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch saved items count");
    }
  };

  const handleLogin = (userData, token) => {
    // Store token first - critical for authenticated API calls
    if (token) {
      localStorage.setItem("token", token);
    }
    
    // Then set user data
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Track user in analytics
    if (userData?.id) {
      setUserId(userData.id);
    }
    
    // Fetch user-specific data
    fetchCartCount();
    fetchWishlistCount();
    fetchSavedItemsCount();
  };

  const handleLogout = () => {
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setSavedItemsCount(0);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && user.role !== "admin") return <Navigate to="/" />;
    return children;
  };

  // Inner component to use routing hooks
  const AppContent = () => {
    usePageTracking(); // Track page views on route changes
    
    const isMockMode = process.env.REACT_APP_USE_MOCK === 'true';
    
    return (
      <>
        {/* Mock Mode Banner */}
        {isMockMode && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg z-50 sticky top-0">
            🎭 Frontend-Only Mode Active - Using Mock Data (No Backend Required)
          </div>
        )}
        <SkipToMain />
        <InstallPrompt />
        <Toaster 
          position="top-right" 
          richColors 
          duration={5000}
          toastOptions={{
            style: {
              background: 'white',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            },
            className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
          }}
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route
              path="/"
              element={<Home user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />}
            />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route
              path="/products"
              element={<Products user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} fetchCartCount={fetchCartCount} />}
            />
            <Route
              path="/products/:productId"
              element={<ProductDetail user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} fetchCartCount={fetchCartCount} />}
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} fetchCartCount={fetchCartCount} fetchSavedItemsCount={fetchSavedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} fetchCartCount={fetchCartCount} fetchWishlistCount={fetchWishlistCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-items"
              element={
                <ProtectedRoute>
                  <SavedItems user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} fetchCartCount={fetchCartCount} fetchSavedItemsCount={fetchSavedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId/tracking"
              element={
                <ProtectedRoute>
                  <OrderTracking user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addresses"
              element={
                <ProtectedRoute>
                  <Addresses user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Analytics user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Inventory user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Users user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminOrders user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPayments user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminReviews user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={<Compare user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} />}
            />
          </Routes>
        </Suspense>
      </>
    );
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <HelmetProvider>
              <div className="App">
                <AppContent />
              </div>
            </HelmetProvider>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
