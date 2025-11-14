import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Package, Settings, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';

const Inventory = ({ user, onLogout }) => {
  const [alerts, setAlerts] = useState([]);
  const [threshold, setThreshold] = useState(10);
  const [newThreshold, setNewThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({});

  useEffect(() => {
    fetchInventoryAlerts();
  }, []);

  const fetchInventoryAlerts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/inventory/alerts');
      setAlerts(response.data.alerts);
      setThreshold(response.data.low_stock_threshold);
      setNewThreshold(response.data.low_stock_threshold.toString());
      
      // Initialize bulk updates with current stock values
      const initialBulkUpdates = {};
      response.data.alerts.forEach(alert => {
        initialBulkUpdates[alert.product_id] = alert.current_stock;
      });
      setBulkUpdates(initialBulkUpdates);
    } catch (error) {
      toast.error('Failed to load inventory alerts');
      console.error('Inventory error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdUpdate = async () => {
    try {
      const thresholdValue = parseInt(newThreshold);
      if (isNaN(thresholdValue) || thresholdValue < 0) {
        toast.error('Please enter a valid positive number');
        return;
      }

      await axiosInstance.put('/admin/inventory/threshold', null, {
        params: { threshold: thresholdValue }
      });
      
      setThreshold(thresholdValue);
      setShowThresholdDialog(false);
      toast.success('Threshold updated successfully');
      fetchInventoryAlerts();
    } catch (error) {
      toast.error('Failed to update threshold');
      console.error('Threshold update error:', error);
    }
  };

  const handleBulkStockUpdate = async () => {
    try {
      const updates = Object.entries(bulkUpdates)
        .filter(([productId, stock]) => {
          const alert = alerts.find(a => a.product_id === productId);
          return alert && alert.current_stock !== stock;
        })
        .map(([product_id, stock]) => ({
          product_id,
          stock: parseInt(stock)
        }));

      if (updates.length === 0) {
        toast.info('No changes to update');
        return;
      }

      await axiosInstance.put('/admin/inventory/bulk-update', updates);
      
      toast.success(`Successfully updated ${updates.length} product(s)`);
      setShowBulkUpdateDialog(false);
      fetchInventoryAlerts();
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Bulk update error:', error);
    }
  };

  const handleStockChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    setBulkUpdates(prev => ({
      ...prev,
      [productId]: Math.max(0, numValue)
    }));
  };

  const getAlertBadge = (level) => {
    const styles = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      warning: 'bg-orange-100 text-orange-700 border-orange-200',
      low: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    
    const labels = {
      critical: 'Out of Stock',
      warning: 'Critical Low',
      low: 'Low Stock'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Inventory Management"
        description="Manage product inventory, monitor stock levels, and receive low stock alerts. Admin dashboard for inventory control."
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
            Inventory Management
          </h1>
          <p className="text-gray-600">Monitor and manage your stock levels</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Low Stock Alerts</p>
                  <p className="text-3xl font-bold mt-2">{alerts.length}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Out of Stock</p>
                  <p className="text-3xl font-bold mt-2">
                    {alerts.filter(a => a.alert_level === 'critical').length}
                  </p>
                </div>
                <AlertCircle className="h-12 w-12 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Alert Threshold</p>
                  <p className="text-3xl font-bold mt-2">{threshold} units</p>
                </div>
                <Settings className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Dialog open={showThresholdDialog} onOpenChange={setShowThresholdDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-600">
                <Settings className="h-4 w-4 mr-2" />
                Update Threshold
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Low Stock Threshold</DialogTitle>
                <DialogDescription>
                  Set the stock level at which products will trigger low stock alerts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="threshold">Threshold (units)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    placeholder="Enter threshold value"
                  />
                </div>
                <Button onClick={handleThresholdUpdate} className="w-full">
                  Update Threshold
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Bulk Update Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Stock Update</DialogTitle>
                <DialogDescription>
                  Update stock levels for multiple products at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {alerts.length > 0 ? (
                  <>
                    <div className="grid gap-4">
                      {alerts.map((alert) => (
                        <div key={alert.product_id} className="flex items-center gap-4 p-4 border border-purple-100 rounded-lg">
                          <img
                            src={alert.image_url}
                            alt={alert.product_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{alert.product_name}</p>
                            <p className="text-sm text-gray-600">{alert.brand} - {alert.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Stock:</Label>
                            <Input
                              type="number"
                              min="0"
                              value={bulkUpdates[alert.product_id] || 0}
                              onChange={(e) => handleStockChange(alert.product_id, e.target.value)}
                              className="w-24"
                            />
                          </div>
                          {getAlertBadge(alert.alert_level)}
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleBulkStockUpdate} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save All Changes
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-4">No products with low stock</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts Table */}
        <Card className="bg-white/80 backdrop-blur-lg border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-100">
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Brand</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-center py-3 px-4">Current Stock</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.product_id} className="border-b border-purple-50 hover:bg-purple-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={alert.image_url}
                              alt={alert.product_name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <span className="font-medium">{alert.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{alert.brand}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            {alert.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-semibold ${alert.current_stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {alert.current_stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getAlertBadge(alert.alert_level)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">All products are well stocked!</p>
                <p className="text-gray-500">No low stock alerts at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </main>
      </div>
    </>
  );
};

export default Inventory;
