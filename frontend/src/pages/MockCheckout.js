import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Lock, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

const MockCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get checkout data from location state or sessionStorage
    const data = location.state?.checkoutData || JSON.parse(sessionStorage.getItem('mockCheckoutData') || 'null');
    
    if (!data) {
      toast.error('No checkout data found');
      navigate('/cart');
      return;
    }
    
    setCheckoutData(data);
    
    // Store in sessionStorage for page refresh
    if (!sessionStorage.getItem('mockCheckoutData')) {
      sessionStorage.setItem('mockCheckoutData', JSON.stringify(data));
    }
    
    // Pre-fill with mock data
    setEmail(data.userEmail || 'customer@example.com');
    setName(data.userName || 'Test Customer');
  }, [location.state, navigate]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '');
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.replace(/\//g, '').length <= 4) {
      setExpiry(formatted);
    }
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!cardNumber || !expiry || !cvc || !name || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Invalid card number');
      return;
    }

    if (expiry.length < 5) {
      toast.error('Invalid expiry date');
      return;
    }

    if (cvc.length < 3) {
      toast.error('Invalid CVC');
      return;
    }

    setLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      // Generate mock session ID
      const mockSessionId = 'mock_cs_' + Math.random().toString(36).substring(2, 15);
      
      // Clear checkout data
      sessionStorage.removeItem('mockCheckoutData');
      
      // Show success and redirect
      toast.success('Payment successful!');
      navigate(`/payment-success?session_id=${mockSessionId}&mock=true`);
    }, 2000);
  };

  const handleCancel = () => {
    sessionStorage.removeItem('mockCheckoutData');
    navigate('/cart');
  };

  if (!checkoutData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Stripe-like Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GS</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Gee Ess Opticals</h1>
              <p className="text-xs text-gray-500">Secure Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Lock className="w-4 h-4" />
            <span className="font-medium">Secure Payment</span>
          </div>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <span className="font-semibold">DEMO MODE:</span>
            This is a mock checkout page. No actual payment will be processed.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to cart
            </Button>

            <Card className="border-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Payment details</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="customer@example.com"
                      required
                    />
                  </div>

                  {/* Card Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card information
                    </label>
                    <div className="space-y-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full px-4 py-3 border-b border-gray-300 dark:border-gray-600 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:text-white"
                          placeholder="1234 1234 1234 1234"
                          required
                        />
                        <CreditCard className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                      <div className="grid grid-cols-2">
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="px-4 py-3 border-r border-gray-300 dark:border-gray-600 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:text-white"
                          placeholder="MM / YY"
                          required
                        />
                        <input
                          type="text"
                          value={cvc}
                          onChange={handleCvcChange}
                          className="px-4 py-3 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:text-white"
                          placeholder="CVC"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cardholder name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Full name on card"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Pay ₹${checkoutData.total.toFixed(2)}`
                    )}
                  </Button>
                </form>

                {/* Security Notice */}
                <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Your payment information is encrypted and secure. This is a demo checkout page.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Card Info */}
            <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  💳 Test Card Information
                </p>
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p>Card: 4242 4242 4242 4242</p>
                  <p>Expiry: Any future date (e.g., 12/34)</p>
                  <p>CVC: Any 3 digits (e.g., 123)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order summary</h2>
                
                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {checkoutData.items.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="relative">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.brand}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{checkoutData.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {checkoutData.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{checkoutData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{checkoutData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white dark:bg-gray-800 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Secure checkout
            </span>
            <span>•</span>
            <span>Demo Mode - No real charges</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockCheckout;
