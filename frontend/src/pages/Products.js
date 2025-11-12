import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Glasses, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const Products = ({ user, onLogout, cartCount, fetchCartCount }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      const response = await axiosInstance.get('/products', { params });
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchProducts();
      return;
    }
    try {
      const response = await axiosInstance.get('/products', { params: { search } });
      setProducts(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const addToCart = async (productId) => {
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Explore Our Collection
        </h1>

        {/* Filters */}
        <div className="glass p-6 rounded-2xl mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search for eyeglasses, brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12"
                />
                <Button data-testid="search-btn" onClick={handleSearch} className="h-12">
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="category-select" className="h-12">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="kids">Kids</SelectItem>
                <SelectItem value="sunglasses">Sunglasses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                data-testid={`product-card-${product.id}`}
                className="product-card glass border-0 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</p>
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                    <Button
                      data-testid={`add-to-cart-${product.id}`}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;