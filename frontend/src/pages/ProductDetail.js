import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Glasses, ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const ProductDetail = ({ user, onLogout, cartCount, fetchCartCount }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axiosInstance.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await axiosInstance.post('/cart', { product_id: productId, quantity: 1 });
      toast.success('Added to cart');
      fetchCartCount();
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

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
                    <Link to="/profile">
                      <Button data-testid="profile-btn" variant="outline">Profile</Button>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link to="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="glass rounded-3xl overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{product.brand}</p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <div className="glass p-4 rounded-xl">
                <h3 className="font-semibold mb-2 text-gray-900">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              <div className="glass p-4 rounded-xl">
                <h3 className="font-semibold mb-3 text-gray-900">Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium capitalize text-gray-900">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frame Type</p>
                    <p className="font-medium capitalize text-gray-900">{product.frame_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frame Shape</p>
                    <p className="font-medium capitalize text-gray-900">{product.frame_shape}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Color</p>
                    <p className="font-medium capitalize text-gray-900">{product.color}</p>
                  </div>
                </div>
              </div>

              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-500">Stock Status</p>
                <p className="font-medium text-green-600">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                data-testid="add-to-cart-btn"
                onClick={addToCart}
                disabled={product.stock === 0}
                className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;