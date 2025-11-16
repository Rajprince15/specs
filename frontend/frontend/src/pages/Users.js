import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users as UsersIcon, Search, Eye, Shield, ShieldOff, ChevronLeft, ChevronRight, UserCircle, Mail, Phone, MapPin, Calendar, Package, Heart, ShoppingCart, MessageSquare, DollarSign, Trash2, UserCog, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const Users = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/users', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchQuery || undefined
        }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleViewDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      setShowDetailsDialog(true);
      const response = await axiosInstance.get(`/admin/users/${userId}`);
      setUserDetails(response.data);
      setSelectedUser(response.data.user);
    } catch (error) {
      toast.error('Failed to load user details');
      console.error('Error fetching user details:', error);
      setShowDetailsDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBlockUnblock = async (userId, currentlyBlocked) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/block`);
      toast.success(response.data.message);
      fetchUsers();
      if (showDetailsDialog && selectedUser?.id === userId) {
        handleViewDetails(userId); // Refresh details
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user status');
      console.error('Error blocking/unblocking user:', error);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will permanently delete the user and ALL their data (orders, cart, reviews, etc.). This action cannot be undone.')) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully', {
        description: 'All user data has been permanently removed'
      });
      setShowDetailsDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error deleting user:', error);
    }
  };

  // Change user role
  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    const message = newRole === 'admin' 
      ? 'Are you sure you want to make this user an admin? They will have full access to admin features.'
      : 'Are you sure you want to remove admin privileges from this user?';

    if (!window.confirm(message)) {
      return;
    }

    try {
      await axiosInstance.put(`/admin/users/${userId}/role`, newRole, {
        headers: { 'Content-Type': 'text/plain' }
      });
      toast.success(`User role updated to ${newRole}`, {
        description: `User now has ${newRole} privileges`
      });
      
      // Refresh details if dialog is open
      if (showDetailsDialog && userDetails?.user?.id === userId) {
        handleViewDetails(userId);
      }
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error updating user role:', error);
    }
  };

  // Open edit dialog
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowEditDialog(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save user edits
  const handleSaveUserEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await axiosInstance.put(`/admin/users/${editingUser.id}`, editFormData);
      toast.success('User updated successfully', {
        description: 'User information has been updated'
      });
      setShowEditDialog(false);
      setEditingUser(null);
      
      // Refresh the user list
      fetchUsers();
      
      // Refresh details if dialog is open
      if (showDetailsDialog && userDetails?.user?.id === editingUser.id) {
        handleViewDetails(editingUser.id);
      }
    } catch (error) {
      toast.error('Failed to update user', {
        description: error.response?.data?.detail || 'Please try again'
      });
      console.error('Error updating user:', error);
    }
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

  return (
    <>
      <SEO
        title="User Management"
        description="Manage user accounts, monitor user activity, and control access. Admin dashboard for user management and moderation."
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Admin navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                Gee Ess Opticals - User Management
              </span>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:hidden">
                Users
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/admin" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors hidden md:inline">
                Dashboard
              </Link>
              <Link to="/admin/analytics" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors hidden lg:inline">
                Analytics
              </Link>
              <Link to="/admin/inventory" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors hidden lg:inline">
                Inventory
              </Link>
              <Button onClick={onLogout} variant="outline" size="sm">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and monitor all user accounts</p>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="md:col-span-3 bg-white/80 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold mt-1">{total}</p>
                </div>
                <UsersIcon className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center min-w-[180px]">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div className="ml-3 sm:ml-4 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{u.name}</div>
                                <div className="text-xs text-gray-500 truncate">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{u.phone}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.is_blocked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {u.is_blocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(u.id)}
                                title="View Details"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(u)}
                                title="Edit User"
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {u.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant={u.is_blocked ? "default" : "destructive"}
                                  onClick={() => handleBlockUnblock(u.id, u.is_blocked)}
                                  className="hidden lg:flex"
                                >
                                  {u.is_blocked ? (
                                    <><Shield className="w-4 h-4 mr-1" /> Unblock</>
                                  ) : (
                                    <><ShieldOff className="w-4 h-4 mr-1" /> Block</>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                      Page {currentPage} of {totalPages} <span className="hidden sm:inline">({total} total users)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">Previous</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <span className="mr-1 hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-6 h-6" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the user and their activity
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading details...</p>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-sm sm:text-base break-words">{userDetails.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-sm sm:text-base flex items-center gap-1 break-all">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="break-all">{userDetails.user.email}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-sm sm:text-base flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {userDetails.user.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Role</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userDetails.user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userDetails.user.role}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userDetails.user.is_blocked
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {userDetails.user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Joined</p>
                    <p className="font-medium text-sm sm:text-base flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{formatDate(userDetails.user.created_at)}</span>
                    </p>
                  </div>
                  {userDetails.user.address && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="font-medium text-sm sm:text-base flex items-start gap-1">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{userDetails.user.address}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Activity Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4 text-center">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <p className="text-2xl font-bold">{userDetails.statistics.total_orders}</p>
                      <p className="text-xs opacity-90">Orders</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <p className="text-2xl font-bold">₹{userDetails.statistics.total_spent.toFixed(2)}</p>
                      <p className="text-xs opacity-90">Spent</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <p className="text-2xl font-bold">{userDetails.statistics.cart_items}</p>
                      <p className="text-xs opacity-90">Cart Items</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                    <CardContent className="p-4 text-center">
                      <Heart className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <p className="text-2xl font-bold">{userDetails.statistics.wishlist_items}</p>
                      <p className="text-xs opacity-90">Wishlist</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <p className="text-2xl font-bold">{userDetails.statistics.reviews_count}</p>
                      <p className="text-xs opacity-90">Reviews</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Orders */}
              {userDetails.recent_orders.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Recent Orders</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userDetails.recent_orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {order.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              ₹{order.total_amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.order_status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.order_status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.order_status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.order_status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDate(order.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleEditUser(userDetails.user);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Edit User Info</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeRole(userDetails.user.id, userDetails.user.role)}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{userDetails.user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</span>
                    <span className="sm:hidden">{userDetails.user.role === 'admin' ? 'Remove' : 'Make'} Admin</span>
                  </Button>
                  
                  {userDetails.user.role !== 'admin' && (
                    <Button
                      variant={userDetails.user.is_blocked ? "default" : "destructive"}
                      size="sm"
                      onClick={() => {
                        handleBlockUnblock(userDetails.user.id, userDetails.user.is_blocked);
                      }}
                    >
                      {userDetails.user.is_blocked ? (
                        <><Shield className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Unblock User</span><span className="sm:hidden">Unblock</span></>
                      ) : (
                        <><ShieldOff className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Block User</span><span className="sm:hidden">Block</span></>
                      )}
                    </Button>
                  )}
                </div>
                
                {userDetails.user.role !== 'admin' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleDeleteUser(userDetails.user.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Edit User Information
            </DialogTitle>
            <DialogDescription>
              Update user details. Changes will be saved to the database.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              {/* User Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Cannot be changed)
                </label>
                <Input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  placeholder="Enter user name"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => handleEditFormChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => handleEditFormChange('address', e.target.value)}
                  placeholder="Enter address (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUserEdit}
                  disabled={!editFormData.name || !editFormData.phone}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
      </div>
    </>
  );
};

export default Users;
