import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ShoppingBag, Glasses, Search, Plus, Clock, SlidersHorizontal, GitCompare, X, Heart } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import { ProductAddedToast } from '@/components/EnhancedToast';
import Navigation from '@/components/Navigation';

const Products = ({ user, onLogout, cartCount, wishlistCount, savedItemsCount, fetchCartCount }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 500]);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState({ products: [], brands: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Compare products state
  const [compareProducts, setCompareProducts] = useState([]);

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
      const product = products.find(p => p.id === productId);
      await axiosInstance.post('/cart', { product_id: productId, quantity: 1 });
      
      // Show enhanced toast with product details
      toast.custom((t) => (
        <ProductAddedToast 
          product={product} 
          action="cart"
        />
      ), { duration: 5000 });
      
      fetchCartCount();
    } catch (error) {
      toast.error('Failed to add to cart', {
        description: error.response?.data?.detail || 'Please try again'
      });
    }
  };

  // Add to wishlist
  const addToWishlist = async (productId, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const product = products.find(p => p.id === productId);
      await axiosInstance.post('/wishlist', { product_id: productId });
      
      // Show enhanced toast with product details
      toast.custom((t) => (
        <ProductAddedToast 
          product={product} 
          action="wishlist"
        />
      ), { duration: 5000 });
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Already in wishlist', {
          description: 'This product is already in your wishlist'
        });
      } else {
        toast.error('Failed to add to wishlist', {
          description: error.response?.data?.detail || 'Please try again'
        });
      }
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

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSortBy('newest');
    setPriceRange([0, 500]);
    setShowSuggestions(false);
  };

  // Filter and sort products
  const filteredAndSortedProducts = () => {
    let filtered = [...products];

    // Apply price range filter
    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        // Assuming products are already sorted by newest from backend
        break;
    }

    return filtered;
  };

  const displayProducts = filteredAndSortedProducts();

  return (
    <>
      <SEO
        title="Shop Premium Eyewear & Glasses"
        description="Browse our extensive collection of premium eyewear, glasses, and sunglasses. Find the perfect frames for men, women, and kids at Gee Ess Opticals. Free shipping on all orders."
        keywords="shop glasses online, eyewear collection, buy sunglasses, designer frames, prescription eyeglasses"
        ogImage="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&h=630&fit=crop"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <Navigation user={user} onLogout={onLogout} cartCount={cartCount} wishlistCount={wishlistCount} savedItemsCount={savedItemsCount} showWishlist={true} showSavedItems={true} />

      {/* Content */}
      <main id="main-content">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto"
                  >
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && search.length < 2 && (
                      <div className="p-3 border-b dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Recent Searches</div>
                        {recentSearches.map((recent, idx) => (
                          <div
                            key={`recent-${idx}`}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                              selectedIndex === idx ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              setSearch(recent);
                              handleSearch(recent);
                            }}
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{recent}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Product Suggestions */}
                    {suggestions.products.length > 0 && (
                      <div className="p-3 border-b dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Products</div>
                        {suggestions.products.map((product, idx) => {
                          const itemIndex = recentSearches.length + idx;
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                selectedIndex === itemIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                <div className="font-medium text-gray-900 dark:text-white truncate">{product.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</div>
                              </div>
                              <div className="text-blue-600 dark:text-blue-400 font-semibold">₹{product.price.toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Brand Suggestions */}
                    {suggestions.brands.length > 0 && (
                      <div className="p-3 border-b dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Brands</div>
                        {suggestions.brands.map((brand, idx) => {
                          const itemIndex = recentSearches.length + suggestions.products.length + idx;
                          return (
                            <div
                              key={`brand-${idx}`}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                selectedIndex === itemIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => {
                                setSearch(brand);
                                handleSearch(brand);
                              }}
                            >
                              <Search className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300">{brand}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Category Suggestions */}
                    {suggestions.categories.length > 0 && (
                      <div className="p-3">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Categories</div>
                        {suggestions.categories.map((cat, idx) => {
                          const itemIndex = recentSearches.length + suggestions.products.length + suggestions.brands.length + idx;
                          return (
                            <div
                              key={`cat-${idx}`}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                selectedIndex === itemIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => {
                                setCategory(cat);
                                setSearch('');
                                setShowSuggestions(false);
                              }}
                            >
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300 capitalize">{cat}</span>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
              <div className="flex items-center gap-2 flex-wrap pt-4 border-t dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Active Filters:</span>
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
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No products found</p>
            <Button onClick={clearFilters} className="mt-4">Clear Filters</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{displayProducts.length}</span> of <span className="font-semibold text-gray-900 dark:text-gray-100">{products.length}</span> products
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
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
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Compare</span>
                  </div>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => addToWishlist(product.id, e)}
                  className="absolute top-2 right-2 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-pink-50 dark:hover:bg-pink-900/50 rounded-full shadow-lg transition-all hover:scale-110 group"
                  aria-label="Add to wishlist"
                >
                  <Heart className="w-5 h-5 text-gray-600 group-hover:text-pink-500 group-hover:fill-pink-500 transition-colors" />
                </button>
                
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
                  
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-bold text-blue-600">₹{product.price.toFixed(2)}</p>
                    <div className="flex gap-2">
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
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom">
          <div className="glass border-2 border-blue-500 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 w-full sm:min-w-[400px] sm:max-w-4xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <GitCompare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">Compare Products</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {compareProducts.length} product{compareProducts.length > 1 ? 's' : ''} selected (Max: 4)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={goToCompare}
                  disabled={compareProducts.length < 2}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Compare
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCompareProducts([])}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Product Thumbnails */}
            <div className="flex gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1">
              {compareProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-gray-300"
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
      </main>
      </div>
    </>
  );
};

export default Products;