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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Explore Our Collection
          </h1>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="glass p-6 rounded-2xl mb-8 space-y-6">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search for eyeglasses, brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
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

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="sort-select" className="h-12">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  data-testid="clear-filters-btn"
                  variant="outline"
                  onClick={clearFilters}
                  className="h-12 w-full flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </label>
              <div className="px-2">
                <Slider
                  data-testid="price-slider"
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {(search || category !== 'all' || priceRange[0] > 0 || priceRange[1] < 500 || sortBy !== 'newest') && (
              <div className="flex items-center gap-2 flex-wrap pt-4 border-t">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                {search && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                    Search: {search}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
                  </span>
                )}
                {category !== 'all' && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1">
                    Category: {category}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setCategory('all')} />
                  </span>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 500) && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                    Price: ${priceRange[0]} - ${priceRange[1]}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 500])} />
                  </span>
                )}
                {sortBy !== 'newest' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-1">
                    Sort: {sortBy.replace('_', ' ')}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSortBy('newest')} />
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No products found</p>
            <Button onClick={clearFilters} className="mt-4">Clear Filters</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{products.length}</span> products
              </p>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Products;