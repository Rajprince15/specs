import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Glasses, Search, Plus, Clock, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const Products = ({ user, onLogout, cartCount, fetchCartCount }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState({ products: [], brands: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    loadRecentSearches();
  }, [category]);

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  // Save search to recent searches
  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    let recent = [...recentSearches];
    // Remove if already exists
    recent = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
    // Add to beginning
    recent.unshift(query);
    // Keep only last 5
    recent = recent.slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  };

  // Fetch search suggestions
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions({ products: [], brands: [], categories: [] });
      return;
    }
    try {
      const response = await axiosInstance.get('/search/suggestions', { params: { q: query } });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to fetch suggestions');
    }
  };

  // Debounce search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        fetchSuggestions(search);
      } else {
        setSuggestions({ products: [], brands: [], categories: [] });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSearch = async (query = search) => {
    if (!query.trim()) {
      fetchProducts();
      return;
    }
    try {
      const response = await axiosInstance.get('/products', { params: { search: query } });
      setProducts(response.data);
      saveRecentSearch(query);
      setShowSuggestions(false);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems = suggestions.products.length + suggestions.brands.length + suggestions.categories.length + recentSearches.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        handleSelectSuggestion(selectedIndex);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (index) => {
    let currentIndex = 0;
    
    // Recent searches
    if (index < recentSearches.length) {
      const query = recentSearches[index];
      setSearch(query);
      handleSearch(query);
      return;
    }
    currentIndex += recentSearches.length;
    
    // Products
    if (index < currentIndex + suggestions.products.length) {
      const product = suggestions.products[index - currentIndex];
      navigate(`/products/${product.id}`);
      setShowSuggestions(false);
      return;
    }
    currentIndex += suggestions.products.length;
    
    // Brands
    if (index < currentIndex + suggestions.brands.length) {
      const brand = suggestions.brands[index - currentIndex];
      setSearch(brand);
      handleSearch(brand);
      return;
    }
    currentIndex += suggestions.brands.length;
    
    // Categories
    if (index < currentIndex + suggestions.categories.length) {
      const cat = suggestions.categories[index - currentIndex];
      setCategory(cat);
      setSearch('');
      setShowSuggestions(false);
      return;
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

  // Toggle product for comparison
  const toggleCompare = (product) => {
    setCompareProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          toast.error('You can compare maximum 4 products at a time');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  // Remove product from compare
  const removeFromCompare = (productId) => {
    setCompareProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Navigate to compare page
  const goToCompare = () => {
    if (compareProducts.length < 2) {
      toast.error('Please select at least 2 products to compare');
      return;
    }
    const productIds = compareProducts.map(p => p.id).join(',');
    navigate(`/compare?products=${productIds}`);
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
            {/* Search Bar with Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative" ref={searchRef}>
                <div className="flex gap-2">
                  <Input
                    data-testid="search-input"
                    type="text"
                    placeholder="Search for eyeglasses, brands..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                      setSelectedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    className="h-12"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && (search.length >= 2 || recentSearches.length > 0) && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] overflow-y-auto"
                  >
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && search.length < 2 && (
                      <div className="p-3 border-b">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Searches</div>
                        {recentSearches.map((recent, idx) => (
                          <div
                            key={`recent-${idx}`}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                              selectedIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSearch(recent);
                              handleSearch(recent);
                            }}
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{recent}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Product Suggestions */}
                    {suggestions.products.length > 0 && (
                      <div className="p-3 border-b">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Products</div>
                        {suggestions.products.map((product, idx) => {
                          const itemIndex = recentSearches.length + idx;
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                selectedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                navigate(`/products/${product.id}`);
                                setShowSuggestions(false);
                              }}
                            >
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.brand}</div>
                              </div>
                              <div className="text-blue-600 font-semibold">${product.price.toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Brand Suggestions */}
                    {suggestions.brands.length > 0 && (
                      <div className="p-3 border-b">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Brands</div>
                        {suggestions.brands.map((brand, idx) => {
                          const itemIndex = recentSearches.length + suggestions.products.length + idx;
                          return (
                            <div
                              key={`brand-${idx}`}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                selectedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setSearch(brand);
                                handleSearch(brand);
                              }}
                            >
                              <Search className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{brand}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Category Suggestions */}
                    {suggestions.categories.length > 0 && (
                      <div className="p-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Categories</div>
                        {suggestions.categories.map((cat, idx) => {
                          const itemIndex = recentSearches.length + suggestions.products.length + suggestions.brands.length + idx;
                          return (
                            <div
                              key={`cat-${idx}`}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                selectedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setCategory(cat);
                                setSearch('');
                                setShowSuggestions(false);
                              }}
                            >
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 capitalize">{cat}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* No Results */}
                    {search.length >= 2 && 
                     suggestions.products.length === 0 && 
                     suggestions.brands.length === 0 && 
                     suggestions.categories.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No results found for "{search}"</p>
                      </div>
                    )}
                  </div>
                )}
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
                className="product-card glass border-0 overflow-hidden cursor-pointer relative"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                {/* Compare Checkbox */}
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 glass p-2 rounded-lg">
                    <Checkbox
                      checked={compareProducts.some(p => p.id === product.id)}
                      onCheckedChange={() => toggleCompare(product)}
                      className="border-2 border-blue-500 data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-xs font-medium text-gray-700">Compare</span>
                  </div>
                </div>
                
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
                  
                  {/* Stock Indicator */}
                  {product.stock === 0 ? (
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Out of Stock
                    </span>
                  ) : product.stock < 10 ? (
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Only {product.stock} left
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      In Stock
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                    <Button
                      data-testid={`add-to-cart-${product.id}`}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
                      disabled={product.stock === 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Floating Compare Bar */}
      {compareProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom">
          <div className="glass border-2 border-blue-500 rounded-2xl shadow-2xl p-4 min-w-[400px] max-w-4xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <GitCompare className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Compare Products</h3>
                  <p className="text-sm text-gray-600">
                    {compareProducts.length} product{compareProducts.length > 1 ? 's' : ''} selected (Max: 4)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={goToCompare}
                  disabled={compareProducts.length < 2}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  Compare Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCompareProducts([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {/* Product Thumbnails */}
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {compareProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;