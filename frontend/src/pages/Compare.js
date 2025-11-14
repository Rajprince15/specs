import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Glasses, ShoppingBag, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const Compare = ({ user, onLogout, cartCount }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Failed to add to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  // Get all unique specs for comparison
  const getSpecRows = () => {
    const specs = [
      { label: 'Price', key: 'price', format: (val) => `$${val.toFixed(2)}` },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
                    <Button variant="outline">Admin Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/cart">
                      <Button variant="outline" className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {cartCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Link to="/orders">
                      <Button variant="outline">Orders</Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="outline">Profile</Button>
                    </Link>
                  </>
                )}
                <Button onClick={onLogout} variant="destructive">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/products')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Product Comparison
            </h1>
            <p className="text-gray-600 mt-2">Comparing {products.length} product{products.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="inline-flex gap-4 min-w-full">
            {/* Empty column for spec labels */}
            <div className="flex-shrink-0 w-48">
              <Card className="glass border-0 mb-4">
                <CardContent className="p-4 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900">Product Images</h3>
                  </div>
                </CardContent>
              </Card>
              {getSpecRows().map((spec) => (
                <div
                  key={spec.label}
                  className={`glass p-4 mb-2 rounded-lg font-semibold text-gray-900 ${
                    isDifferent(spec.key) ? 'bg-yellow-50 border-2 border-yellow-300' : ''
                  }`}
                >
                  {spec.label}
                  {isDifferent(spec.key) && (
                    <span className="ml-2 text-xs text-yellow-600">(Different)</span>
                  )}
                </div>
              ))}
              <div className="glass p-4 rounded-lg font-semibold text-gray-900">
                Actions
              </div>
            </div>

            {/* Product columns */}
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-64">
                {/* Product Image and Basic Info */}
                <Card className="glass border-0 mb-4 relative">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 z-10 w-8 h-8 p-0"
                    onClick={() => removeProduct(product.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{product.name}</h3>
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
                      className={`glass p-4 mb-2 rounded-lg text-gray-700 ${
                        isHighlighted ? 'bg-yellow-50 border-2 border-yellow-300 font-semibold' : ''
                      }`}
                    >
                      {formattedValue}
                    </div>
                  );
                })}

                {/* Actions */}
                <div className="glass p-4 rounded-lg space-y-2">
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

        {/* Legend */}
        <div className="mt-8 glass p-6 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-300 rounded"></div>
              <span className="text-sm text-gray-700">Highlighted specs indicate differences between products</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
