import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, ShoppingBag, Glasses } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecommendationsAndRecent();
    }
  }, [user]);

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
    } finally {
      setLoading(false);
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