import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, ShoppingBag, Glasses, Star, Truck, Award, Clock, Sparkles, Tag, Users, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import SEO from '@/components/SEO';
import Navigation from '@/components/Navigation';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/formatters';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Home = ({ user, onLogout, cartCount, wishlistCount, savedItemsCount }) => {
  const { t, i18n } = useTranslation();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
    if (user) {
      fetchRecommendationsAndRecent();
    }
  }, [user]);

  const fetchTrendingProducts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products?limit=8`);
      setTrendingProducts(response.data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendationsAndRecent = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [recommendedRes, recentRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/products/recommended?limit=8`, config),
        axios.get(`${BACKEND_URL}/api/user/recently-viewed?limit=6`, config)
      ]);
      
      setRecommendedProducts(recommendedRes.data);
      setRecentlyViewed(recentRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  return (
    <>
      <SEO
        title="Premium Eyewear Online"
        description="Shop the finest collection of eyewear at Gee Ess Opticals. Discover stylish glasses, sunglasses, and frames from top brands. Quality eyewear for men, women, and kids with free shipping."
        keywords="eyewear online, buy glasses online, sunglasses, designer frames, prescription glasses"
        ogType="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <Navigation user={user} onLogout={onLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} showWishlist={true} showSavedItems={true} />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-6" aria-label="Hero section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('home.hero.title')}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex gap-4">
                <Link to="/products">
                  <Button data-testid="shop-now-btn" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
                    {t('home.hero.cta')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1759910546772-73e4bb7fdadd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxleWVnbGFzc2VzJTIwY29sbGVjdGlvbnxlbnwwfHx8fDE3NjI5Njk3NzR8MA&ixlib=rb-4.1.0&q=85"
                  alt="Premium eyeglasses collection featuring modern frames and designer sunglasses"
                  className="rounded-3xl shadow-2xl"
                  loading="eager"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products - Only for logged in users */}
      {user && recommendedProducts.length > 0 && (
        <section className="py-16 px-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900" aria-label="Recommended products">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.recommended')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/products/${product.id}`}
                  className="glass rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.price, 'INR', i18n.language)}</span>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-600 dark:text-green-400">{t('products.inStock')}</span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400">{t('products.outOfStock')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed - Only for logged in users */}
      {user && recentlyViewed.length > 0 && (
        <section className="py-16 px-6 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('home.recentlyViewed')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/products/${product.id}`}
                  className="glass rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.price, 'INR', i18n.language)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products - For all users */}
      {!user && trendingProducts.length > 0 && (
        <section className="py-16 px-6 bg-white dark:bg-gray-900" aria-label="Trending products">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                🔥 Trending Now
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Discover what's hot in eyewear fashion
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/products/${product.id}`}
                  className="glass rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      HOT
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.price, 'INR', i18n.language)}</span>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-600 dark:text-green-400">{t('products.inStock')}</span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400">{t('products.outOfStock')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop by Category */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Find the perfect eyewear for every occasion
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Link to="/products?category=eyeglasses" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=600&fit=crop"
                  alt="Eyeglasses collection"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Eyeglasses</h3>
                  <p className="text-white/90">Prescription & fashion frames</p>
                </div>
              </div>
            </Link>
            <Link to="/products?category=sunglasses" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop"
                  alt="Sunglasses collection"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Sunglasses</h3>
                  <p className="text-white/90">UV protection & style</p>
                </div>
              </div>
            </Link>
            <Link to="/products?category=sports" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&h=600&fit=crop"
                  alt="Sports eyewear collection"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Sports Eyewear</h3>
                  <p className="text-white/90">Performance & durability</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('home.features.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('home.features.quality.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.quality.desc')}
              </p>
            </div>
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('home.features.delivery.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.delivery.desc')}
              </p>
            </div>
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('home.features.support.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('home.features.support.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Extended */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Choose Gee Ess Opticals?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-3xl mx-auto">
              We're committed to providing the best eyewear shopping experience with unmatched quality and service
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Free Shipping</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">On all orders above ₹999</p>
            </div>
            <div className="glass p-6 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Premium Brands</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Authentic designer eyewear</p>
            </div>
            <div className="glass p-6 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">24/7 Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Always here to help you</p>
            </div>
            <div className="glass p-6 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Easy Returns</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Trusted by thousands of happy customers
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "Amazing quality and fast delivery! The glasses are exactly as shown and fit perfectly. Highly recommend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  RS
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Rajesh Sharma</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified Customer</p>
                </div>
              </div>
            </div>
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "Best online eyewear store! Great collection, affordable prices, and excellent customer service."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  PK
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Priya Kumar</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified Customer</p>
                </div>
              </div>
            </div>
            <div className="glass p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "Love my new sunglasses! The quality is outstanding and they look even better than in the photos."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  AM
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Amit Mehta</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div className="space-y-2">
              <div className="text-5xl font-bold">10K+</div>
              <div className="text-xl opacity-90">Happy Customers</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">500+</div>
              <div className="text-xl opacity-90">Premium Brands</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">5000+</div>
              <div className="text-xl opacity-90">Products</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">4.9★</div>
              <div className="text-xl opacity-90">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">{t('home.hero.title')}</h2>
          <p className="text-xl opacity-90">
            {t('home.hero.subtitle')}
          </p>
          <Link to="/products">
            <Button data-testid="explore-collection-btn" size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg">
              {t('common.viewAll')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Glasses className="w-6 h-6" />
            <span className="text-xl font-bold">Gee Ess Opticals</span>
          </div>
          <p className="text-gray-400">© 2025 Gee Ess Opticals. All rights reserved.</p>
        </div>
      </footer>
    </main>
    </div>
    </>
  );
};

export default Home;