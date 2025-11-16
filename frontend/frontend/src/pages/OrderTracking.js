import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Glasses, Package, Truck, CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const OrderTracking = ({ user, onLogout, cartCount }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}/tracking`);
      setTracking(response.data);
    } catch (error) {
      toast.error('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      processing: {
        icon: Clock,
        color: 'text-blue-600 bg-blue-50',
        label: 'Processing',
        description: 'Your order is being prepared'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50',
        label: 'Confirmed',
        description: 'Order confirmed and ready for shipping'
      },
      shipped: {
        icon: Truck,
        color: 'text-purple-600 bg-purple-50',
        label: 'Shipped',
        description: 'Your order is on the way'
      },
      delivered: {
        icon: Package,
        color: 'text-emerald-600 bg-emerald-50',
        label: 'Delivered',
        description: 'Order has been delivered'
      },
      cancelled: {
        icon: Clock,
        color: 'text-red-600 bg-red-50',
        label: 'Cancelled',
        description: 'Order has been cancelled'
      }
    };
    return statusMap[status] || statusMap.processing;
  };

  const getStepNumber = (status) => {
    const steps = ['processing', 'confirmed', 'shipped', 'delivered'];
    return steps.indexOf(status) + 1;
  };

  const currentStep = tracking ? getStepNumber(tracking.current_status) : 0;

  if (loading) {
    return (
      <>
        <SEO
          title="Track Your Order"
          description="Track your eyewear order status and delivery details at Gee Ess Opticals. Get real-time updates on your glasses and sunglasses shipment."
          keywords="order tracking, delivery status, shipment tracking, order status"
          noindex={true}
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <Navigation user={user} onLogout={onLogout} cartCount={cartCount} />
          <div className="flex justify-center items-center h-[60vh]" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" aria-label="Loading order tracking information"></div>
          </div>
        </div>
      </>
    );
  }

  if (!tracking) {
    return (
      <>
        <SEO
          title="Order Not Found"
          description="Track your eyewear order status and delivery details at Gee Ess Opticals."
          keywords="order tracking"
          noindex={true}
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <Navigation user={user} onLogout={onLogout} cartCount={cartCount} />
          <main id="main-content" className="container mx-auto px-4 py-8">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Tracking Not Found</h2>
              <p className="text-gray-500 mb-6">Unable to find tracking information for this order.</p>
              <Button onClick={() => navigate('/orders')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </CardContent>
          </Card>
          </main>
        </div>
      </>
    );
  }

  const currentStatusInfo = getStatusInfo(tracking.current_status);
  const StatusIcon = currentStatusInfo.icon;

  return (
    <>
      <SEO
        title="Track Your Order"
        description="Track your eyewear order status and delivery details at Gee Ess Opticals. Get real-time updates on your glasses and sunglasses shipment."
        keywords="order tracking, delivery status, shipment tracking, order status"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navigation user={user} onLogout={onLogout} cartCount={cartCount} />

        <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/orders')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Order Tracking
          </h1>
          <p className="text-gray-600">Order ID: {tracking.order_id}</p>
        </div>

        {/* Current Status Card */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${currentStatusInfo.color}`}>
                <StatusIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{currentStatusInfo.label}</h2>
                <p className="text-gray-600">{currentStatusInfo.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              {tracking.tracking_number && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-semibold text-gray-800">{tracking.tracking_number}</p>
                </div>
              )}
              {tracking.estimated_delivery && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(tracking.estimated_delivery).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(tracking.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                <p className="font-semibold text-gray-800">
                  {new Date(tracking.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Order Progress</h3>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div 
                className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-purple-600 to-pink-600 transition-all duration-500"
                style={{ height: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {/* Status Steps */}
              <div className="space-y-8">
                {['processing', 'confirmed', 'shipped', 'delivered'].map((status, index) => {
                  const stepInfo = getStatusInfo(status);
                  const StepIcon = stepInfo.icon;
                  const isCompleted = getStepNumber(status) <= currentStep;
                  const isCurrent = status === tracking.current_status;

                  return (
                    <div key={status} className="relative flex items-start gap-4">
                      <div
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        <StepIcon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 pt-2">
                        <h4 className={`font-semibold ${isCurrent ? 'text-purple-600' : 'text-gray-800'}`}>
                          {stepInfo.label}
                        </h4>
                        <p className="text-sm text-gray-600">{stepInfo.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking History */}
        {tracking.tracking_history && tracking.tracking_history.length > 0 && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Tracking History</h3>
              
              <div className="space-y-4">
                {tracking.tracking_history.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {tracking.tracking_history.length - index}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 capitalize">{event.status}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(event.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
    </>
  );
};

const Navigation = ({ user, onLogout, cartCount }) => {
  const navigate = useNavigate();

  return (
    <nav className="backdrop-blur-md bg-white/80 border-b sticky top-0 z-50 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Glasses className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gee Ess Opticals
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost">Products</Button>
            </Link>
            {user && (
              <>
                <Link to="/orders">
                  <Button variant="ghost">Orders</Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
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

export default OrderTracking;
