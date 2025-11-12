import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Glasses, Trash2, Minus, Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const Cart = ({ user, onLogout, cartCount, fetchCartCount }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState('stripe');
  const [availableGateways, setAvailableGateways] = useState([]);

  useEffect(() => {
    fetchCart();
    fetchAvailableGateways();
  }, []);

  const fetchAvailableGateways = async () => {
    try {
      const response = await axiosInstance.get('/payment/gateways');
      setAvailableGateways(response.data);
      // Set default gateway to first available
      if (response.data.length > 0) {
        setPaymentGateway(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch payment gateways');
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axiosInstance.get('/cart');
      setCartItems(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axiosInstance.delete(`/cart/${productId}`);
      toast.success('Item removed from cart');
      fetchCart();
      fetchCartCount();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    
    try {
      if (paymentGateway === 'stripe') {
        await handleStripeCheckout();
      } else if (paymentGateway === 'razorpay') {
        await handleRazorpayCheckout();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Checkout failed');
      setCheckoutLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    const originUrl = window.location.origin;
    const response = await axiosInstance.post('/payment/checkout', { origin_url: originUrl });
    window.location.href = response.data.url;
  };

  const handleRazorpayCheckout = async () => {
    const originUrl = window.location.origin;
    const response = await axiosInstance.post('/payment/razorpay/create-order', { origin_url: originUrl });
    
    const options = {
      key: response.data.key_id,
      amount: response.data.amount,
      currency: response.data.currency,
      order_id: response.data.order_id,
      name: "LensKart",
      description: "Eyewear Purchase",
      image: `${originUrl}/logo.png`,
      handler: async (razorpayResponse) => {
        try {
          await axiosInstance.post('/payment/razorpay/verify', {
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_signature: razorpayResponse.razorpay_signature
          });
          
          toast.success('Payment successful!');
          navigate('/orders');
        } catch (error) {
          toast.error('Payment verification failed');
          setCheckoutLoading(false);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: () => {
          setCheckoutLoading(false);
          toast.info('Payment cancelled');
        }
      }
    };

    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    };
    script.onerror = () => {
      toast.error('Failed to load payment gateway');
      setCheckoutLoading(false);
    };
    document.body.appendChild(script);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
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
            <Link to="/products">
              <Button data-testid="products-btn" variant="outline">Products</Button>
            </Link>
            <Link to="/orders">
              <Button data-testid="orders-btn" variant="outline">Orders</Button>
            </Link>
            <Button data-testid="logout-btn" onClick={onLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Shopping Cart
        </h1>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-6">Your cart is empty</p>
            <Link to="/products">
              <Button data-testid="continue-shopping-btn" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} data-testid={`cart-item-${item.id}`} className="glass border-0">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.product?.image_url}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide">
                            {item.product?.brand}
                          </p>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {item.product?.name}
                          </h3>
                          <p className="text-2xl font-bold text-blue-600 mt-2">
                            ${item.product?.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">Quantity: {item.quantity}</span>
                          </div>
                          <Button
                            data-testid={`remove-item-${item.id}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="glass border-0 sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span data-testid="cart-total" className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Gateway Selection */}
                  {availableGateways.length > 1 && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <CreditCard className="w-5 h-5" />
                        <span>Payment Method</span>
                      </div>
                      <div className="space-y-2">
                        {availableGateways.map((gateway) => (
                          <label
                            key={gateway.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              paymentGateway === gateway.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentGateway"
                              value={gateway.id}
                              checked={paymentGateway === gateway.id}
                              onChange={(e) => setPaymentGateway(e.target.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{gateway.name}</div>
                              <div className="text-sm text-gray-600">{gateway.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {gateway.currencies.join(', ')}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    data-testid="checkout-btn"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg"
                  >
                    {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </Button>
                  <Link to="/products">
                    <Button data-testid="continue-shopping-link" variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;