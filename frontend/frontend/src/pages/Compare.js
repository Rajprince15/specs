import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import Navigation from '@/components/Navigation';

const Compare = ({ user, onLogout, cartCount, wishlistCount, savedItemsCount, fetchCartCount }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMobileProduct, setCurrentMobileProduct] = useState(0);

  useEffect(() => {
    const productIds = searchParams.get('products');
    if (productIds) {
      fetchProducts(productIds.split(','));
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchProducts = async (ids) => {
    try {
      const promises = ids.map(id => axiosInstance.get(`/products/${id}`));
      const responses = await Promise.all(promises);
      setProducts(responses.map(res => res.data));
    } catch (error) {
      toast.error('Failed to load products for comparison');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (productId) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    if (updatedProducts.length === 0) {
      navigate('/products');
      return;
    }
    const newIds = updatedProducts.map(p => p.id).join(',');
    navigate(`/compare?products=${newIds}`);
  };

  const addToCart = async (productId) => {
    if (!user) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    try {
      await axiosInstance.post('/cart', { product_id: productId, quantity: 1 });
      toast.success('Added to cart!');
      if (fetchCartCount) fetchCartCount();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Failed to add to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  const nextProduct = () => {
    setCurrentMobileProduct((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentMobileProduct((prev) => (prev - 1 + products.length) % products.length);
  };

  // Get all unique specs for comparison
  const getSpecRows = () => {
    const specs = [
      { label: 'Price', key: 'price', format: (val) => `₹${val.toFixed(2)}` },
      { label: 'Brand', key: 'brand' },
      { label: 'Category', key: 'category', format: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
      { label: 'Frame Type', key: 'frame_type', format: (val) => val.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
      { label: 'Frame Shape', key: 'frame_shape', format: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
      { label: 'Color', key: 'color' },
      { label: 'Stock', key: 'stock' },
    ];
    return specs;
  };

  // Check if values are different for highlighting
  const isDifferent = (key) => {
    if (products.length < 2) return false;
    const values = products.map(p => p[key]);
    return !values.every(v => v === values[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading comparison...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Products to Compare</h2>
        <p className="text-gray-600 mb-6">Add products to compare from the products page</p>
        <Button onClick={() => navigate('/products')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Compare Eyewear Products"
        description="Compare eyewear products side-by-side at Gee Ess Opticals. Easily compare features, prices, and specifications to find your perfect glasses or sunglasses."
        keywords="compare eyewear, compare glasses, compare sunglasses, product comparison"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <Navigation
          user={user}
          onLogout={onLogout}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          savedItemsCount={savedItemsCount}
        />

        {/* Content */}
        <main id="main-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <Button
                variant="outline"
                onClick={() => navigate('/products')}
                className="mb-4"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Product Comparison
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comparing {products.length} product{products.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Desktop Comparison Table (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <div className="inline-flex gap-4 min-w-full">
                {/* Empty column for spec labels */}
                <div className="flex-shrink-0 w-48">
                  <Card className="glass border-0 mb-4 dark:bg-gray-800/50">
                    <CardContent className="p-4 h-80 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Product Images</h3>
                      </div>
                    </CardContent>
                  </Card>
                  {getSpecRows().map((spec) => (
                    <div
                      key={spec.label}
                      className={`glass p-4 mb-2 rounded-lg font-semibold text-gray-900 dark:text-gray-100 ${
                        isDifferent(spec.key) ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600' : ''
                      }`}
                    >
                      {spec.label}
                      {isDifferent(spec.key) && (
                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(Different)</span>
                      )}
                    </div>
                  ))}
                  <div className="glass p-4 rounded-lg font-semibold text-gray-900 dark:text-gray-100">
                    Actions
                  </div>
                </div>

                {/* Product columns */}
                {products.map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-64">
                    {/* Product Image and Basic Info */}
                    <Card className="glass border-0 mb-4 relative dark:bg-gray-800/50">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 z-10 w-8 h-8 p-0"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{product.brand}</p>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{product.name}</h3>
                      </CardContent>
                    </Card>

                    {/* Specifications */}
                    {getSpecRows().map((spec) => {
                      const value = product[spec.key];
                      const formattedValue = spec.format ? spec.format(value) : value;
                      const isHighlighted = isDifferent(spec.key);
                      
                      return (
                        <div
                          key={spec.label}
                          className={`glass p-4 mb-2 rounded-lg text-gray-700 dark:text-gray-300 ${
                            isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600 font-semibold' : ''
                          }`}
                        >
                          {formattedValue}
                        </div>
                      );
                    })}

                    {/* Actions */}
                    <div className="glass p-4 rounded-lg space-y-2 dark:bg-gray-800/50">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Stacked Cards (visible on mobile only) */}
            <div className="md:hidden space-y-6">
              {/* Product Navigation */}
              {products.length > 1 && (
                <div className="flex items-center justify-between glass p-4 rounded-lg dark:bg-gray-800/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevProduct}
                    disabled={currentMobileProduct === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product {currentMobileProduct + 1} of {products.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextProduct}
                    disabled={currentMobileProduct === products.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Product Cards */}
              {products.map((product, index) => (
                <Card
                  key={product.id}
                  className={`glass border-0 dark:bg-gray-800/50 ${
                    index !== currentMobileProduct ? 'hidden' : ''
                  }`}
                >
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 z-10 w-8 h-8 p-0"
                      onClick={() => removeProduct(product.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    {/* Product Name */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{product.brand}</p>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mt-1">{product.name}</h3>
                    </div>

                    {/* Specifications */}
                    <div className="space-y-3 border-t dark:border-gray-700 pt-4">
                      {getSpecRows().map((spec) => {
                        const value = product[spec.key];
                        const formattedValue = spec.format ? spec.format(value) : value;
                        const isHighlighted = isDifferent(spec.key);
                        
                        return (
                          <div
                            key={spec.label}
                            className={`flex justify-between items-center p-3 rounded-lg ${
                              isHighlighted 
                                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600' 
                                : 'bg-gray-50 dark:bg-gray-700/50'
                            }`}
                          >
                            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                              {spec.label}
                              {isHighlighted && (
                                <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">*</span>
                              )}
                            </span>
                            <span className={`text-sm text-gray-900 dark:text-gray-100 ${isHighlighted ? 'font-semibold' : ''}`}>
                              {formattedValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Legend for mobile */}
              {products.length > 1 && (
                <div className="glass p-4 rounded-lg dark:bg-gray-800/50">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600 rounded flex-shrink-0 mt-0.5"></div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      * Highlighted specs indicate differences between products
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Legend for Desktop */}
            <div className="hidden md:block mt-8 glass p-6 rounded-xl dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Legend</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Highlighted specs indicate differences between products</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Compare;
