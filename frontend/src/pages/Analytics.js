import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, DollarSign, Package, ShoppingCart, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Analytics = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState({ summary: {}, daily_sales: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Colors for charts
  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [salesResponse, productsResponse, revenueResponse] = await Promise.all([
        axiosInstance.get('/admin/analytics/sales', { params }),
        axiosInstance.get('/admin/analytics/top-products', { params: { ...params, limit: 10 } }),
        axiosInstance.get('/admin/analytics/revenue', { params })
      ]);

      setSalesData(salesResponse.data);
      setTopProducts(productsResponse.data.top_products);
      setRevenueData(revenueResponse.data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    fetchAnalytics();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchAnalytics(), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Sales Analytics"
        description="View sales analytics, revenue insights, and top-performing products. Admin dashboard for business intelligence."
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50" role="navigation" aria-label="Admin navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-2 hover:opacity-80">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button onClick={onLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Sales Analytics
          </h1>
          <p className="text-gray-600">Monitor your store's performance and insights</p>
        </div>

        {/* Date Filter */}
        <Card className="mb-8 bg-white/80 backdrop-blur-lg border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={handleDateFilter} className="bg-gradient-to-r from-purple-600 to-cyan-600">
                Apply Filter
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Orders</p>
                  <p className="text-3xl font-bold mt-2">{salesData.summary.total_orders || 0}</p>
                </div>
                <ShoppingCart className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">${salesData.summary.total_revenue?.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="h-12 w-12 text-cyan-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-3xl font-bold mt-2">${salesData.summary.average_order_value?.toFixed(2) || '0.00'}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart */}
        <Card className="mb-8 bg-white/80 backdrop-blur-lg border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.daily_sales && salesData.daily_sales.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesData.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_revenue"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    name="Revenue ($)"
                    dot={{ fill: '#8b5cf6', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_orders"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    name="Orders"
                    dot={{ fill: '#06b6d4', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No sales data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Category */}
          <Card className="bg-white/80 backdrop-blur-lg border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Revenue by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.revenue_by_category && revenueData.revenue_by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueData.revenue_by_category}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, revenue }) => `${category}: $${revenue.toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {revenueData.revenue_by_category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">No category data available</div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Payment Status */}
          <Card className="bg-white/80 backdrop-blur-lg border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue by Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.revenue_by_payment_status && revenueData.revenue_by_payment_status.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData.revenue_by_payment_status}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="status" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">No payment status data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="bg-white/80 backdrop-blur-lg border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-100">
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Brand</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-right py-3 px-4">Qty Sold</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={product.product_id} className="border-b border-purple-50 hover:bg-purple-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <span className="font-medium">{product.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{product.brand}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">{product.quantity_sold}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          ${product.total_revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No product sales data available</div>
            )}
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
    </>
  );
};

export default Analytics;
