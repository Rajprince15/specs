import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, Glasses, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import Navigation from '@/components/Navigation';

const SavedItems = ({ user, onLogout, cartCount, savedItemsCount, fetchCartCount, fetchSavedItemsCount }) => {
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const response = await axiosInstance.get('/saved-items');
      setSavedItems(response.data);
    } catch (error) {
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  const moveToCart = async (savedItemId) => {
    try {
      await axiosInstance.post(`/saved-items/${savedItemId}/move-to-cart`);
      toast.success('Item moved to cart');
      fetchSavedItems();
      if (fetchCartCount) fetchCartCount();
      if (fetchSavedItemsCount) fetchSavedItemsCount();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to move item to cart');
    }
  };

  const deleteSavedItem = async (savedItemId) => {
    try {
      await axiosInstance.delete(`/saved-items/${savedItemId}`);
      toast.success('Item removed');
      fetchSavedItems();
      if (fetchSavedItemsCount) fetchSavedItemsCount();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <>
        <SEO
          title="Saved Items"
          description="View and manage items you've saved for later. Shop your saved eyewear at Gee Ess Opticals."
          keywords="saved items, save for later, saved glasses"
          noindex={true}
        />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Navigation user={user} onLogout={onLogout} cartCount={cartCount} savedItemsCount={savedItemsCount} />
          <div className="flex justify-center items-center h-[60vh]" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-label="Loading saved items"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Saved Items"
        description="View and manage items you've saved for later. Shop your saved eyewear at Gee Ess Opticals."
        keywords="saved items, save for later, saved glasses"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation user={user} onLogout={onLogout} cartCount={cartCount} savedItemsCount={savedItemsCount} />

        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Saved for Later
            </h1>
            <p className="text-gray-600" role="status" aria-live="polite">
              {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {savedItems.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bookmark className="w-24 h-24 text-gray-300 mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Saved Items</h2>
                <p className="text-gray-500 mb-6">Items you save for later will appear here</p>
                <Button
                  onClick={() => navigate('/products')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  aria-label="Browse products"
                >
                  <Glasses className="mr-2 h-4 w-4" aria-hidden="true" />
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedItems.map((item) => (
                <Card
                  key={item.id}
                  className="backdrop-blur-sm bg-white/80 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  role="article"
                  aria-label={`${item.product?.name} saved item`}
                >
                  <CardContent className="p-0">
                    {/* Image Section */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
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
                      
                      {/* Saved Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                          <Bookmark className="w-3 h-3" aria-hidden="true" />
                          Saved
                        </span>
                      </div>
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
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{item.product?.price?.toFixed(2)}
                        </span>
                        {item.product?.category && (
                          <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-medium rounded-full">
                            {item.product?.category}
                          </span>
                        )}
                      </div>

                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-600 mb-3">
                          Quantity: <span className="font-semibold">{item.quantity}</span>
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => moveToCart(item.id)}
                          disabled={item.product?.stock === 0}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={item.product?.stock === 0 ? 'Product out of stock' : `Move ${item.product?.name} to cart`}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                          {item.product?.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                        </Button>
                        <Button
                          onClick={() => deleteSavedItem(item.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          aria-label={`Remove ${item.product?.name} from saved items`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Bar */}
          {savedItems.length > 0 && (
            <div className="mt-8 flex justify-center gap-4">
              <Button
                onClick={() => navigate('/products')}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Glasses className="mr-2 h-4 w-4" aria-hidden="true" />
                Continue Shopping
              </Button>
              <Button
                onClick={() => navigate('/cart')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
                View Cart
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default SavedItems;
