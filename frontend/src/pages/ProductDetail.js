import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Glasses, ArrowLeft, ShoppingCart, Star, Edit2, Trash2, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const ProductDetail = ({ user, onLogout, cartCount, fetchCartCount }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchRelatedProducts();
    fetchProductImages();
    trackProductView();
  }, [productId]);

  const trackProductView = async () => {
    if (user) {
      try {
        await axiosInstance.post(`/user/recently-viewed/${productId}`);
      } catch (error) {
        console.error('Failed to track product view');
      }
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/related?limit=4`);
      setRelatedProducts(response.data);
    } catch (error) {
      console.error('Failed to load related products');
    }
  };

  const fetchProductImages = async () => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/images`);
      setProductImages(response.data);
    } catch (error) {
      console.error('Failed to load product images');
      setProductImages([]);
    }
  };

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

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (editingReview) {
        await axiosInstance.put(`/reviews/${editingReview.id}`, { rating, comment });
        toast.success('Review updated successfully');
      } else {
        await axiosInstance.post(`/products/${productId}/reviews`, { rating, comment });
        toast.success('Review submitted successfully');
      }
      setRating(5);
      setComment('');
      setShowReviewForm(false);
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || '');
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axiosInstance.delete(`/reviews/${reviewId}`);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const cancelReviewForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setRating(5);
    setComment('');
  };

  const nextImage = () => {
    const images = productImages.length > 0 ? productImages : [{ image_url: product?.image_url }];
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  };

  const prevImage = () => {
    const images = productImages.length > 0 ? productImages : [{ image_url: product?.image_url }];
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
    setIsZoomed(false);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const userReview = user ? reviews.find(r => r.user_id === user.user_id) : null;

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
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image with Carousel */}
            <div className="glass rounded-3xl overflow-hidden relative group">
              <div className={`relative ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <img
                  src={(productImages.length > 0 ? productImages[currentImageIndex]?.image_url : product.image_url) || product.image_url}
                  alt={product.name}
                  className={`w-full h-[500px] object-cover transition-transform duration-300 ${
                    isZoomed ? 'scale-150' : 'scale-100'
                  }`}
                />
                {!isZoomed && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </div>
                )}
              </div>

              {/* Carousel Navigation - Only show if multiple images */}
              {(productImages.length > 1 || (productImages.length === 0 && product.image_url)) && productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => selectImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      currentImageIndex === index
                        ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
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

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {averageRating} out of 5
                  </span>
                  <span className="text-gray-500">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
            {user && !userReview && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Write a Review
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="glass border-0 mb-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  {editingReview ? 'Edit Your Review' : 'Write Your Review'}
                </h3>
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 cursor-pointer transition-colors ${
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment (Optional)
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                      {editingReview ? 'Update Review' : 'Submit Review'}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelReviewForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <p className="text-gray-600">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <Card className="glass border-0">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">No reviews yet. Be the first to review this product!</p>
                {user && !showReviewForm && (
                  <Button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Write the First Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="glass border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{review.user_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {user && user.user_id === review.user_id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="glass rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={relatedProduct.image_url}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{relatedProduct.brand}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        ${relatedProduct.price}
                      </span>
                      {relatedProduct.stock > 0 ? (
                        <span className="text-xs text-green-600">In Stock</span>
                      ) : (
                        <span className="text-xs text-red-600">Out of Stock</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;