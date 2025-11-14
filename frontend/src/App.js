import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import Orders from "@/pages/Orders";
import OrderTracking from "@/pages/OrderTracking";
import Profile from "@/pages/Profile";
import Addresses from "@/pages/Addresses";
import AdminDashboard from "@/pages/AdminDashboard";
import Analytics from "@/pages/Analytics";
import Inventory from "@/pages/Inventory";
import PaymentSuccess from "@/pages/PaymentSuccess";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: API,
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchCartCount();
      fetchWishlistCount();
    }
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await axiosInstance.get("/cart");
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
      const response = await axiosInstance.get("/wishlist");
      setWishlistCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch wishlist count");
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    fetchCartCount();
    fetchWishlistCount();
  };

  const handleLogout = () => {
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && user.role !== "admin") return <Navigate to="/" />;
    return children;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route
            path="/"
            element={<Home user={user} onLogout={handleLogout} cartCount={cartCount} />}
          />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route
            path="/products"
            element={<Products user={user} onLogout={handleLogout} cartCount={cartCount} fetchCartCount={fetchCartCount} />}
          />
          <Route
            path="/products/:productId"
            element={<ProductDetail user={user} onLogout={handleLogout} cartCount={cartCount} fetchCartCount={fetchCartCount} />}
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart user={user} onLogout={handleLogout} cartCount={cartCount} fetchCartCount={fetchCartCount} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist user={user} onLogout={handleLogout} cartCount={cartCount} wishlistCount={wishlistCount} fetchCartCount={fetchCartCount} fetchWishlistCount={fetchWishlistCount} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders user={user} onLogout={handleLogout} cartCount={cartCount} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/tracking"
            element={
              <ProtectedRoute>
                <OrderTracking user={user} onLogout={handleLogout} cartCount={cartCount} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile user={user} onLogout={handleLogout} cartCount={cartCount} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <Addresses user={user} onLogout={handleLogout} cartCount={cartCount} />
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
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess user={user} onLogout={handleLogout} cartCount={cartCount} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
