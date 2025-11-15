import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Glasses, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const Wishlist = ({ user, onLogout, cartCount, wishlistCount, fetchCartCount, fetchWishlistCount }) => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await axiosInstance.get('/wishlist');
      setWishlistItems(response.data);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await axiosInstance.delete(`/wishlist/${productId}`);
      toast.success('Removed from wishlist');
      fetchWishlist();
      if (fetchWishlistCount) fetchWishlistCount();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const moveToCart = async (item) => {
    try {
      // Add to cart
      await axiosInstance.post('/cart', { 
        product_id: item.product_id,
        quantity: 1 
      });
      
      // Remove from wishlist
      await axiosInstance.delete(`/wishlist/${item.product_id}`);
      
      toast.success('Moved to cart');
      fetchWishlist();
      if (fetchCartCount) fetchCartCount();
      if (fetchWishlistCount) fetchWishlistCount();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to move to cart');
    }
  };

  if (loading) {
    return (
      <>
        <SEO
          title="My Wishlist"
          description="View and manage your saved eyewear favorites. Add premium glasses and sunglasses to your wishlist at Gee Ess Opticals for easy shopping later."
          keywords="wishlist, saved items, favorite eyewear, saved glasses"
          noindex={true}
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <Navigation user={user} onLogout={onLogout} cartCount={cartCount} wishlistCount={wishlistCount} />
          <div className="flex justify-center items-center h-[60vh]" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" aria-label="Loading wishlist"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="My Wishlist"
        description="View and manage your saved eyewear favorites. Add premium glasses and sunglasses to your wishlist at Gee Ess Opticals for easy shopping later."
        keywords="wishlist, saved items, favorite eyewear, saved glasses"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navigation user={user} onLogout={onLogout} cartCount={cartCount} wishlistCount={wishlistCount} />

        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600" role="status" aria-live="polite">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {wishlistItems.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Heart className="w-24 h-24 text-gray-300 mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your Wishlist is Empty</h2>
                <p className="text-gray-500 mb-6">Start adding items you love!</p>
                <Button
                  onClick={() => navigate('/products')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  aria-label="Browse products"
                >
                  <Glasses className="mr-2 h-4 w-4" aria-hidden="true" />
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <Card
                  key={item.id}
                  className="backdrop-blur-sm bg-white/80 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  role="article"
                  aria-label={`${item.product?.name} wishlist item`}
                >
                  <CardContent className="p-0">
                    {/* Image Section */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                      <img
                        src={item.product?.image_url || '/api/placeholder/400/300'}
                        alt={`${item.product?.name} - ${item.product?.brand} eyewear`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/300';
                        }}
                      />
                      
                      {/* Stock Badge */}
                      {item.product?.stock === 0 && (
                        <div className="absolute top-2 right-2">
                          <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full" role="status">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {item.product?.stock > 0 && item.product?.stock < 10 && (
                        <div className="absolute top-2 right-2">
                          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full" role="status">
                            Only {item.product?.stock} left
                          </span>
                        </div>
                      )}
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(item.product_id)}
                        className="absolute top-2 left-2 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-lg transition-colors"
                        aria-label={`Remove ${item.product?.name} from wishlist`}
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="block hover:opacity-80 transition-opacity"
                        aria-label={`View ${item.product?.name} details`}
                      >
                        <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2">
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.product?.brand}
                        </p>
                      </Link>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ₹{item.product?.price?.toFixed(2)}
                        </span>
                        {item.product?.category && (
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium rounded-full">
                            {item.product?.category}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => moveToCart(item)}
                          disabled={item.product?.stock === 0}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={item.product?.stock === 0 ? 'Product out of stock' : `Move ${item.product?.name} to cart`}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                          {item.product?.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

const Navigation = ({ user, onLogout, cartCount, wishlistCount }) => {
  const navigate = useNavigate();

  return (
    <nav className="backdrop-blur-md bg-white/80 border-b sticky top-0 z-50 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" aria-label="Gee Ess Opticals Home">
            <Glasses className="h-8 w-8 text-purple-600" aria-hidden="true" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gee Ess Opticals
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" aria-label="Home page">Home</Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" aria-label="Products page">Products</Button>
            </Link>
            {user && (
              <>
                <Link to="/wishlist">
                  <Button variant="ghost" className="relative" aria-label={`Wishlist with ${wishlistCount} items`}>
                    <Heart className="h-5 w-5" aria-hidden="true" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-label={`${wishlistCount} items in wishlist`}>
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/cart">
                  <Button variant="ghost" className="relative" aria-label={`Shopping cart with ${cartCount} items`}>
                    <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-label={`${cartCount} items in cart`}>
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="ghost" aria-label="Orders page">Orders</Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" aria-label="Profile page">Profile</Button>
                </Link>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                  aria-label="Logout from account"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Wishlist;
