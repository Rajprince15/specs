import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Glasses, TrendingUp, Shield } from 'lucide-react';

const Home = ({ user, onLogout, cartCount }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LensKart
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link to="/admin">
                    <Button data-testid="admin-dashboard-btn" variant="outline">Admin Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/cart">
                      <Button data-testid="cart-btn" variant="outline" className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {cartCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Link to="/orders">
                      <Button data-testid="orders-btn" variant="outline">Orders</Button>
                    </Link>
                  </>
                )}
                <Button data-testid="logout-btn" onClick={onLogout} variant="destructive">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button data-testid="login-btn" variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button data-testid="register-btn">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  See the World
                </span>
                <br />
                <span className="text-gray-900">Differently</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-xl">
                Discover premium eyewear that combines style, comfort, and clarity. Your perfect frames are just a click away.
              </p>
              <div className="flex gap-4">
                <Link to="/products">
                  <Button data-testid="shop-now-btn" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1759910546772-73e4bb7fdadd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxleWVnbGFzc2VzJTIwY29sbGVjdGlvbnxlbnwwfHx8fDE3NjI5Njk3NzR8MA&ixlib=rb-4.1.0&q=85"
                  alt="Eyeglasses Collection"
                  className="rounded-3xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Why Choose Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Premium Quality</h3>
              <p className="text-gray-600 leading-relaxed">
                Handpicked collection of premium eyewear from top brands worldwide.
              </p>
            </div>
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Easy Shopping</h3>
              <p className="text-gray-600 leading-relaxed">
                Seamless online shopping experience with secure checkout and fast delivery.
              </p>
            </div>
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">100% Authentic</h3>
              <p className="text-gray-600 leading-relaxed">
                Guaranteed authentic products with warranty and easy returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Find Your Perfect Frames?</h2>
          <p className="text-xl opacity-90">
            Browse through our extensive collection and discover eyewear that matches your style.
          </p>
          <Link to="/products">
            <Button data-testid="explore-collection-btn" size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg">
              Explore Collection
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Glasses className="w-6 h-6" />
            <span className="text-xl font-bold">LensKart</span>
          </div>
          <p className="text-gray-400">© 2025 LensKart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;