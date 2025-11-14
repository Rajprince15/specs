import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Glasses, Package, Users, DollarSign, Plus, Edit, Trash2, Images, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({ total_products: 0, total_orders: 0, total_users: 0, total_revenue: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [managingProductId, setManagingProductId] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageOrder, setNewImageOrder] = useState(1);
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    category: 'men',
    frame_type: 'full-rim',
    frame_shape: 'rectangular',
    color: '',
    image_url: '',
    stock: 100
  });

  // Coupon management state
  const [coupons, setCoupons] = useState([]);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '0',
    max_discount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    fetchStats();
    fetchProducts();
    fetchOrders();
    fetchCoupons();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load stats');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock)
      };

      if (editingProduct) {
        await axiosInstance.put(`/products/${editingProduct.id}`, productData);
        toast.success('Product updated successfully');
      } else {
        await axiosInstance.post('/products', productData);
        toast.success('Product created successfully');
      }

      setShowProductDialog(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        brand: '',
        price: '',
        description: '',
        category: 'men',
        frame_type: 'full-rim',
        frame_shape: 'rectangular',
        color: '',
        image_url: '',
        stock: 100
      });
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      brand: product.brand,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      frame_type: product.frame_type,
      frame_shape: product.frame_shape,
      color: product.color,
      image_url: product.image_url,
      stock: product.stock
    });
    setShowProductDialog(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosInstance.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleManageImages = async (productId) => {
    setManagingProductId(productId);
    setShowImageDialog(true);
    try {
      const response = await axiosInstance.get(`/products/${productId}/images`);
      setProductImages(response.data);
    } catch (error) {
      toast.error('Failed to load product images');
      setProductImages([]);
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    try {
      await axiosInstance.post(`/products/${managingProductId}/images`, {
        image_url: newImageUrl,
        display_order: newImageOrder,
        is_primary: newImageIsPrimary
      });
      toast.success('Image added successfully');
      setNewImageUrl('');
      setNewImageOrder(1);
      setNewImageIsPrimary(false);
      // Refresh images
      const response = await axiosInstance.get(`/products/${managingProductId}/images`);
      setProductImages(response.data);
    } catch (error) {
      toast.error('Failed to add image');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await axiosInstance.delete(`/products/${managingProductId}/images/${imageId}`);
      toast.success('Image deleted successfully');
      // Refresh images
      const response = await axiosInstance.get(`/products/${managingProductId}/images`);
      setProductImages(response.data);
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  // Coupon management functions
  const fetchCoupons = async () => {
    try {
      const response = await axiosInstance.get('/admin/coupons');
      setCoupons(response.data);
    } catch (error) {
      toast.error('Failed to load coupons');
    }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        ...couponForm,
        discount_value: parseFloat(couponForm.discount_value),
        min_purchase: parseFloat(couponForm.min_purchase),
        max_discount: couponForm.max_discount ? parseFloat(couponForm.max_discount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        valid_from: new Date(couponForm.valid_from).toISOString(),
        valid_until: new Date(couponForm.valid_until).toISOString()
      };

      if (editingCoupon) {
        await axiosInstance.put(`/admin/coupons/${editingCoupon.id}`, couponData);
        toast.success('Coupon updated successfully');
      } else {
        await axiosInstance.post('/admin/coupons', couponData);
        toast.success('Coupon created successfully');
      }

      setShowCouponDialog(false);
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: '0',
        max_discount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true
      });
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_discount: coupon.max_discount ? coupon.max_discount.toString() : '',
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until.split('T')[0],
      is_active: coupon.is_active
    });
    setShowCouponDialog(true);
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await axiosInstance.delete(`/admin/coupons/${couponId}`);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2">
              <Glasses className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LensKart Admin
              </span>
            </Link>
            <Button data-testid="logout-btn" onClick={onLogout} variant="destructive">
              Logout
            </Button>
          </div>
          <div className="flex gap-2">
            <Link to="/admin">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Package className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                <DollarSign className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link to="/admin/inventory">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-product-btn" onClick={() => { setEditingProduct(null); setProductForm({ name: '', brand: '', price: '', description: '', category: 'men', frame_type: 'full-rim', frame_shape: 'rectangular', color: '', image_url: '', stock: 100 }); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>Fill in the product details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input data-testid="product-name-input" id="name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input data-testid="product-brand-input" id="brand" value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input data-testid="product-price-input" id="price" type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input data-testid="product-stock-input" id="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                      <SelectTrigger data-testid="product-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                        <SelectItem value="kids">Kids</SelectItem>
                        <SelectItem value="sunglasses">Sunglasses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frame_type">Frame Type</Label>
                    <Select value={productForm.frame_type} onValueChange={(value) => setProductForm({ ...productForm, frame_type: value })}>
                      <SelectTrigger data-testid="product-frame-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-rim">Full Rim</SelectItem>
                        <SelectItem value="half-rim">Half Rim</SelectItem>
                        <SelectItem value="rimless">Rimless</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frame_shape">Frame Shape</Label>
                    <Select value={productForm.frame_shape} onValueChange={(value) => setProductForm({ ...productForm, frame_shape: value })}>
                      <SelectTrigger data-testid="product-frame-shape-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rectangular">Rectangular</SelectItem>
                        <SelectItem value="round">Round</SelectItem>
                        <SelectItem value="cat-eye">Cat Eye</SelectItem>
                        <SelectItem value="aviator">Aviator</SelectItem>
                        <SelectItem value="wayfarer">Wayfarer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input data-testid="product-color-input" id="color" value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input data-testid="product-description-input" id="description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input data-testid="product-image-input" id="image_url" type="url" value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} required />
                </div>
                <Button data-testid="product-submit-btn" type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Products</p>
                  <p data-testid="stat-products" className="text-3xl font-bold text-gray-900">{stats.total_products}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p data-testid="stat-orders" className="text-3xl font-bold text-gray-900">{stats.total_orders}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Glasses className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Users</p>
                  <p data-testid="stat-users" className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p data-testid="stat-revenue" className="text-3xl font-bold text-gray-900">${stats.total_revenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card className="glass border-0 mb-12">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Image</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Brand</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Price</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Stock</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} data-testid={`product-row-${product.id}`} className="border-b hover:bg-white/50">
                      <td className="py-3 px-4">
                        <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.brand}</td>
                      <td className="py-3 px-4 text-blue-600 font-semibold">${product.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600">{product.stock}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button data-testid={`edit-product-${product.id}`} size="sm" variant="outline" onClick={() => handleEdit(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button data-testid={`manage-images-${product.id}`} size="sm" variant="outline" onClick={() => handleManageImages(product.id)} title="Manage Images">
                            <Images className="w-4 h-4" />
                          </Button>
                          <Button data-testid={`delete-product-${product.id}`} size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="glass border-0">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Recent Orders</h2>
            <div className="space-y-4">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} data-testid={`order-row-${order.id}`} className="p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${order.total_amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 capitalize">{order.payment_status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coupon Management */}
        <Card className="glass border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Coupon Management</h2>
              <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => { 
                      setEditingCoupon(null); 
                      setCouponForm({ 
                        code: '', 
                        discount_type: 'percentage', 
                        discount_value: '', 
                        min_purchase: '0', 
                        max_discount: '', 
                        usage_limit: '', 
                        valid_from: '', 
                        valid_until: '', 
                        is_active: true 
                      }); 
                    }} 
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                    <DialogDescription>Fill in the coupon details below</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coupon-code">Coupon Code</Label>
                        <Input 
                          id="coupon-code" 
                          value={couponForm.code} 
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} 
                          placeholder="e.g., SAVE20"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount-type">Discount Type</Label>
                        <Select value={couponForm.discount_type} onValueChange={(value) => setCouponForm({ ...couponForm, discount_type: value })}>
                          <SelectTrigger id="discount-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount-value">Discount Value</Label>
                        <Input 
                          id="discount-value" 
                          type="number" 
                          step="0.01" 
                          value={couponForm.discount_value} 
                          onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} 
                          placeholder={couponForm.discount_type === 'percentage' ? '20' : '10.00'}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min-purchase">Minimum Purchase ($)</Label>
                        <Input 
                          id="min-purchase" 
                          type="number" 
                          step="0.01" 
                          value={couponForm.min_purchase} 
                          onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-discount">Max Discount ($) - Optional</Label>
                        <Input 
                          id="max-discount" 
                          type="number" 
                          step="0.01" 
                          value={couponForm.max_discount} 
                          onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })} 
                          placeholder="Leave empty for no limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usage-limit">Usage Limit - Optional</Label>
                        <Input 
                          id="usage-limit" 
                          type="number" 
                          value={couponForm.usage_limit} 
                          onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })} 
                          placeholder="Leave empty for unlimited"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valid-from">Valid From</Label>
                        <Input 
                          id="valid-from" 
                          type="date" 
                          value={couponForm.valid_from} 
                          onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valid-until">Valid Until</Label>
                        <Input 
                          id="valid-until" 
                          type="date" 
                          value={couponForm.valid_until} 
                          onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })} 
                          required 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-active"
                        checked={couponForm.is_active}
                        onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Label htmlFor="is-active" className="cursor-pointer">Active (users can use this coupon)</Label>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                      {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Code</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Value</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Usage</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Valid Until</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-white/50">
                      <td className="py-3 px-4 font-semibold text-blue-600">{coupon.code}</td>
                      <td className="py-3 px-4 text-gray-600 capitalize">{coupon.discount_type}</td>
                      <td className="py-3 px-4 text-gray-900">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value.toFixed(2)}`}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(coupon.valid_until).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {coupon.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Inactive</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCoupon(coupon)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCoupon(coupon.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No coupons created yet. Click "Add Coupon" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Management Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Product Images</DialogTitle>
            <DialogDescription>Add, remove, and manage images for this product</DialogDescription>
          </DialogHeader>

          {/* Add New Image Form */}
          <form onSubmit={handleAddImage} className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">Add New Image</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="new-image-url">Image URL</Label>
                <Input
                  id="new-image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-order">Display Order</Label>
                <Input
                  id="display-order"
                  type="number"
                  min="1"
                  value={newImageOrder}
                  onChange={(e) => setNewImageOrder(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-primary"
                checked={newImageIsPrimary}
                onChange={(e) => setNewImageIsPrimary(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="is-primary" className="cursor-pointer">Set as primary image</Label>
            </div>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </form>

          {/* Current Images */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Current Images ({productImages.length})</h3>
            {productImages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No images uploaded yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {productImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={image.image_url}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {image.is_primary && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      Order: {image.display_order}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;