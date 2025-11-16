import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Glasses, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import { trackPurchase } from '@/utils/analytics';

const PaymentSuccess = ({ user, onLogout, cartCount }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const sessionId = searchParams.get('session_id');
  const isMockMode = searchParams.get('mock') === 'true';

  useEffect(() => {
    if (sessionId) {
      if (isMockMode) {
        // Mock mode - simulate successful payment
        handleMockPayment();
      } else {
        // Real payment - poll status
        pollPaymentStatus();
      }
    } else {
      navigate('/cart');
    }
  }, [sessionId, isMockMode]);

  const handleMockPayment = () => {
    // Simulate payment success for mock mode
    setTimeout(() => {
      setPaymentStatus({
        session_id: sessionId,
        payment_status: 'paid',
        status: 'complete',
        order: {
          id: 'mock_order_' + Date.now(),
          total_amount: 0,
          items: [],
          payment_method: 'stripe_mock'
        }
      });
      toast.success('Mock payment successful!');
      setLoading(false);
    }, 1500);
  };

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      toast.error('Payment status check timed out. Please check your orders.');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/payment/status/${sessionId}`);
      setPaymentStatus(response.data);

      if (response.data.payment_status === 'paid') {
        toast.success('Payment successful!');
        
        // Track purchase in Google Analytics
        if (response.data.order) {
          trackPurchase({
            order_id: response.data.order.id,
            total_amount: response.data.order.total_amount,
            items: response.data.order.items || [],
            payment_method: response.data.order.payment_method || 'stripe'
          });
        }
        
        setLoading(false);
        return;
      } else if (response.data.status === 'expired') {
        toast.error('Payment session expired.');
        setLoading(false);
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Error checking payment status.');
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Payment Successful"
        description="Your order has been successfully placed at Gee Ess Opticals. Thank you for your purchase!"
        keywords="payment successful, order confirmation, purchase complete"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Mock Mode Banner */}
        {isMockMode && (
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
            <div className="max-w-7xl mx-auto px-6 py-2">
              <p className="text-sm text-green-800 dark:text-green-200 text-center">
                <span className="font-semibold">✅ DEMO MODE:</span> This was a mock payment. No real transaction was processed.
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gee Ess Opticals
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/products">
              <Button data-testid="products-btn" variant="outline">Products</Button>
            </Link>
            <Link to="/orders">
              <Button data-testid="orders-btn" variant="outline">Orders</Button>
            </Link>
            <Link to="/profile">
              <Button data-testid="profile-btn" variant="outline">Profile</Button>
            </Link>
            <Button data-testid="logout-btn" onClick={onLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main id="main-content">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Card className="glass border-0 shadow-2xl">
          <CardContent className="p-12 text-center space-y-6">
            {loading ? (
              <>
                <Loader2 className="w-20 h-20 text-blue-600 mx-auto animate-spin" />
                <h1 className="text-3xl font-bold text-gray-900">Processing Payment...</h1>
                <p className="text-gray-600">Please wait while we confirm your payment.</p>
              </>
            ) : paymentStatus?.payment_status === 'paid' ? (
              <>
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
                <h1 data-testid="payment-success-title" className="text-4xl font-bold text-gray-900">Payment Successful!</h1>
                <p className="text-gray-600 text-lg">Thank you for your purchase. Your order has been confirmed.</p>
                <div className="glass p-6 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Amount Paid</p>
                  <p data-testid="payment-amount" className="text-3xl font-bold text-blue-600">
                    ₹{(paymentStatus.amount_total / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Link to="/orders">
                    <Button data-testid="view-orders-btn" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      View Orders
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button data-testid="continue-shopping-btn" variant="outline">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">✕</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Payment Failed</h1>
                <p className="text-gray-600 text-lg">Something went wrong with your payment. Please try again.</p>
                <Link to="/cart">
                  <Button data-testid="try-again-btn" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Try Again
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
    </>
  );
};

export default PaymentSuccess;