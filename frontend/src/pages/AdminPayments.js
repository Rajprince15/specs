import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DollarSign, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  CreditCard,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const AdminPayments = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const paymentsPerPage = 20;

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/payments', {
        params: {
          limit: 100,
          offset: 0
        }
      });
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (sessionId) => {
    try {
      setLoadingDetails(true);
      setShowDetailsDialog(true);
      
      const response = await axiosInstance.get(`/admin/payments/${sessionId}`);
      setSelectedPayment(response.data);
    } catch (error) {
      toast.error('Failed to load payment details', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error fetching payment details:', error);
      setShowDetailsDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (sessionId, paymentStatus, status) => {
    try {
      await axiosInstance.put(`/admin/payments/${sessionId}/status`, null, {
        params: { 
          payment_status: paymentStatus, 
          status: status 
        }
      });
      toast.success('Payment status updated successfully', {
        description: `Payment status changed to ${paymentStatus}`
      });
      
      // Refresh payment details if dialog is open
      if (showDetailsDialog && selectedPayment?.session_id === sessionId) {
        handleViewDetails(sessionId);
      }
      fetchPayments();
    } catch (error) {
      toast.error('Failed to update payment status', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error updating payment status:', error);
    }
  };

  const handleDeletePayment = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this payment transaction? This action cannot be undone.')) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/payments/${sessionId}`);
      toast.success('Payment transaction deleted successfully', {
        description: 'Payment data has been permanently removed'
      });
      setShowDetailsDialog(false);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to delete payment', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error deleting payment:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      paid: <CheckCircle className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      refunded: <DollarSign className="w-4 h-4" />,
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

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      !searchQuery ||
      payment.session_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

  return (
    <>
      <SEO
        title="Payment Transactions Management"
        description="Manage payment transactions, monitor payment status, and handle refunds. Admin dashboard for payment management."
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Admin navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gee Ess Opticals - Payment Management
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Orders
                </Link>
                <Link to="/admin/users" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Users
                </Link>
                <Button onClick={onLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => navigate('/admin')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>

          <Card className="backdrop-blur-sm bg-white/80 shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="w-6 h-6" />
                Payment Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search by session ID or user ID..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payments Table */}
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading payments...</p>
                </div>
              ) : currentPayments.length === 0 ? (
                <div className="text-center py-20">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No payments found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Session ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentPayments.map((payment) => (
                          <tr key={payment.session_id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono text-gray-900">
                                {payment.session_id?.substring(0, 16)}...
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono text-gray-600">
                                {payment.user_id?.substring(0, 8)}...
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{payment.amount?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                                {getStatusIcon(payment.payment_status)}
                                {payment.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(payment.created_at)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(payment.session_id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Showing {indexOfFirstPayment + 1} to {Math.min(indexOfLastPayment, filteredPayments.length)} of {filteredPayments.length} payments
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-4 py-2 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading details...</p>
            </div>
          ) : selectedPayment ? (
            <div className="space-y-6">
              {/* Customer Information - Highlighted Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200">
                <Label className="text-gray-700 font-bold text-base mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </Label>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <Label className="text-gray-500 text-xs">Customer Name</Label>
                    <p className="font-semibold text-gray-900 mt-1">{selectedPayment.user_name || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <Label className="text-gray-500 text-xs">Email Address</Label>
                    <p className="font-medium text-gray-900 mt-1 text-sm break-all">{selectedPayment.user_email || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <Label className="text-gray-500 text-xs">Phone Number</Label>
                    <p className="font-medium text-gray-900 mt-1">{selectedPayment.user_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <Label className="text-gray-700 font-bold text-base mb-3 block">Payment Information</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Session ID</Label>
                    <p className="font-mono text-sm break-all mt-1">{selectedPayment.session_id}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">User ID</Label>
                    <p className="font-mono text-sm break-all mt-1">{selectedPayment.user_id}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Amount</Label>
                    <p className="text-xl font-bold text-blue-600 mt-1">₹{selectedPayment.amount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Currency</Label>
                    <p className="text-sm mt-1">{selectedPayment.currency || 'INR'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Payment Status</Label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedPayment.payment_status)}`}>
                        {getStatusIcon(selectedPayment.payment_status)}
                        {selectedPayment.payment_status}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Status</Label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Created At</Label>
                    <p className="text-sm mt-1">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-gray-500 text-xs">Updated At</Label>
                    <p className="text-sm mt-1">{formatDate(selectedPayment.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Update Status Section */}
              <div className="border-t-2 border-gray-200 pt-6 space-y-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                <div>
                  <Label className="text-gray-700 font-semibold mb-3 block text-base">Quick Actions</Label>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <Label className="text-gray-600 mb-2 block text-sm">Update Payment Status</Label>
                    <Select
                      value={selectedPayment.payment_status}
                      onValueChange={(value) => handleUpdateStatus(selectedPayment.session_id, value, selectedPayment.status)}
                    >
                      <SelectTrigger className="w-full">
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
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Completed</span>
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
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePayment(selectedPayment.session_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Payment Transaction
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPayments;
