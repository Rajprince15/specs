import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Glasses, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const Orders = ({ user, onLogout, cartCount }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'shipped':
        return 'text-purple-600 bg-purple-50';
      case 'delivered':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      <SEO
        title="My Orders"
        description="Track and manage your eyewear orders at Gee Ess Opticals. View order history, shipping status, and delivery details for your premium glasses and sunglasses."
        keywords="order tracking, eyewear orders, order history, shipping status"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Gee Ess Opticals Home">
            <Glasses className="w-8 h-8 text-blue-600" aria-hidden="true" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gee Ess Opticals
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/products">
              <Button data-testid="products-btn" variant="outline">Products</Button>
            </Link>
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
      <main id="main-content" className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Orders
        </h1>

        {loading ? (
          <div className="text-center py-20" role="status" aria-live="polite">
            <p className="text-gray-600 text-lg">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600 text-lg mb-6">No orders yet</p>
            <Link to="/products">
              <Button data-testid="shop-now-btn" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} data-testid={`order-${order.id}`} className="glass border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                      <p className="text-sm text-gray-500">
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-white/50 rounded-xl">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">₹{item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Shipping Address</p>
                      <p className="font-medium text-gray-900">{order.shipping_address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-600">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                      <Link to={`/orders/${order.id}/tracking`}>
                        <Button 
                          data-testid={`track-order-${order.id}`}
                          variant="outline" 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Track Order
                        </Button>
                      </Link>
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

export default Orders;
