import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  MapPin,
  Calendar,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const AdminOrders = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    order_status: '',
    tracking_number: '',
    estimated_delivery: '',
    description: '',
    location: ''
  });

  const ordersPerPage = 20;

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      setShowDetailsDialog(true);
      
      // Fetch order details
      const orderResponse = await axiosInstance.get(`/orders/${orderId}`);
      setOrderDetails(orderResponse.data);
      setSelectedOrder(orderResponse.data);
    } catch (error) {
      toast.error('Failed to load order details');
      console.error('Error fetching order details:', error);
      setShowDetailsDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setUpdateForm({
      order_status: order.order_status,
      tracking_number: order.tracking_number || '',
      estimated_delivery: order.estimated_delivery ? order.estimated_delivery.split('T')[0] : '',
      description: '',
      location: ''
    });
    setShowUpdateDialog(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        order_status: updateForm.order_status,
        tracking_number: updateForm.tracking_number || null,
        estimated_delivery: updateForm.estimated_delivery || null,
        description: updateForm.description || null,
        location: updateForm.location || null
      };

      await axiosInstance.put(`/orders/${selectedOrder.id}/status`, updateData);
      toast.success('Order updated successfully');
      setShowUpdateDialog(false);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update order');
      console.error('Error updating order:', error);
    }
  };

  // Update payment status
  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      await axiosInstance.put(`/admin/orders/${orderId}/payment-status`, newStatus, {
        headers: { 'Content-Type': 'text/plain' }
      });
      toast.success('Payment status updated successfully', {
        description: `Status changed to ${newStatus}`
      });
      
      // Refresh order details if dialog is open
      if (showDetailsDialog && orderDetails?.id === orderId) {
        handleViewDetails(orderId);
      }
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update payment status', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error updating payment status:', error);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone and will permanently delete all order data.')) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/orders/${orderId}`);
      toast.success('Order deleted successfully', {
        description: 'All order data has been permanently removed'
      });
      setShowDetailsDialog(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error deleting order:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      // Order status
      processing: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      // Payment status
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      processing: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <Package className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      paid: <CheckCircle className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOrderStatus = orderStatusFilter === 'all' || order.order_status === orderStatusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    
    return matchesSearch && matchesOrderStatus && matchesPaymentStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="Order Management - Admin Dashboard"
        description="Manage all customer orders, update order status, and track deliveries"
        noindex={true}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-8 h-8 text-blue-600" />
                  Order Management
                </h1>
                <p className="text-gray-600 mt-1">Manage all customer orders and deliveries</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass border-0 mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Orders</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Order ID, User ID, Address..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Order Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="order-status">Order Status</Label>
                <Select 
                  value={orderStatusFilter} 
                  onValueChange={(value) => {
                    setOrderStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select 
                  value={paymentStatusFilter} 
                  onValueChange={(value) => {
                    setPaymentStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {paginatedOrders.length} of {filteredOrders.length} orders
              {searchQuery && ` (filtered from ${orders.length} total)`}
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="glass border-0">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Order ID</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Order Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Payment</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Tracking</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-mono text-sm text-gray-900">
                            {order.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">
                            ₹{order.total_amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                            {getStatusIcon(order.order_status)}
                            {order.order_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.payment_status)}`}>
                            {getStatusIcon(order.payment_status)}
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {order.tracking_number ? (
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {order.tracking_number}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(order.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateOrder(order)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading details...</p>
            </div>
          ) : orderDetails ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Order ID</Label>
                  <p className="font-mono text-sm">{orderDetails.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Order Date</Label>
                  <p className="text-sm">{formatDate(orderDetails.created_at)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Order Status</Label>
                  <p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(orderDetails.order_status)}`}>
                      {getStatusIcon(orderDetails.order_status)}
                      {orderDetails.order_status}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Payment Status</Label>
                  <p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(orderDetails.payment_status)}`}>
                      {getStatusIcon(orderDetails.payment_status)}
                      {orderDetails.payment_status}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Total Amount</Label>
                  <p className="text-xl font-bold text-blue-600">₹{orderDetails.total_amount.toFixed(2)}</p>
                </div>
                {orderDetails.tracking_number && (
                  <div>
                    <Label className="text-gray-500">Tracking Number</Label>
                    <p className="font-mono text-sm">{orderDetails.tracking_number}</p>
                  </div>
                )}
              </div>

              {/* Payment Status Update & Delete Actions */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label className="text-gray-700 mb-2 block">Update Payment Status</Label>
                  <Select
                    value={orderDetails.payment_status}
                    onValueChange={(value) => handleUpdatePaymentStatus(orderDetails.id, value)}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="paid">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Paid</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Failed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="refunded">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span>Refunded</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleUpdateOrder(orderDetails)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Order Status
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteOrder(orderDetails.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Order
                  </Button>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <Label className="text-gray-500 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </Label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-line">{orderDetails.shipping_address}</p>
                </div>
              </div>

              {/* Order Items */}
              {orderDetails.items && orderDetails.items.length > 0 && (
                <div>
                  <Label className="text-gray-500 flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />
                    Order Items ({orderDetails.items.length})
                  </Label>
                  <div className="space-y-3">
                    {orderDetails.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">{item.product_brand}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{item.product_price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Subtotal: ₹{item.subtotal.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking History */}
              {orderDetails.tracking && orderDetails.tracking.length > 0 && (
                <div>
                  <Label className="text-gray-500 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Tracking History
                  </Label>
                  <div className="space-y-2">
                    {orderDetails.tracking.map((track, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{track.status}</p>
                            {track.description && <p className="text-sm text-gray-600">{track.description}</p>}
                            {track.location && <p className="text-xs text-gray-500">{track.location}</p>}
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(track.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Update Order Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update order status and tracking information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-order-status">Order Status *</Label>
              <Select 
                value={updateForm.order_status} 
                onValueChange={(value) => setUpdateForm({ ...updateForm, order_status: value })}
                required
              >
                <SelectTrigger id="update-order-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking-number">Tracking Number</Label>
              <Input
                id="tracking-number"
                placeholder="e.g., TRK123456789"
                value={updateForm.tracking_number}
                onChange={(e) => setUpdateForm({ ...updateForm, tracking_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-delivery">Estimated Delivery Date</Label>
              <Input
                id="estimated-delivery"
                type="date"
                value={updateForm.estimated_delivery}
                onChange={(e) => setUpdateForm({ ...updateForm, estimated_delivery: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Status Description</Label>
              <Input
                id="description"
                placeholder="e.g., Package dispatched from warehouse"
                value={updateForm.description}
                onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Current Location</Label>
              <Input
                id="location"
                placeholder="e.g., Mumbai Distribution Center"
                value={updateForm.location}
                onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpdateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Update Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
