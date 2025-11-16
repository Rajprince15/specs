// Mock data for frontend-only mode

export const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'user@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State 12345',
    role: 'user',
    is_blocked: 0,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Admin User',
    email: 'admin@lenskart.com',
    phone: '+1234567891',
    address: '456 Admin Ave, City, State 12345',
    role: 'admin',
    is_blocked: 0,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockProducts = [
  {
    id: '1',
    name: 'Classic Aviator Sunglasses',
    brand: 'Ray-Ban',
    price: 149.99,
    description: 'Iconic aviator sunglasses with UV protection. Perfect for everyday wear with a timeless design.',
    category: 'sunglasses',
    frame_type: 'full-rim',
    frame_shape: 'aviator',
    color: 'Gold',
    image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
    stock: 50,
    rating: 4.5,
    reviews_count: 128,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Modern Rectangular Frames',
    brand: 'Warby Parker',
    price: 95.00,
    description: 'Sleek rectangular frames perfect for professional settings. Lightweight and durable acetate construction.',
    category: 'men',
    frame_type: 'full-rim',
    frame_shape: 'rectangular',
    color: 'Black',
    image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400',
    stock: 35,
    rating: 4.7,
    reviews_count: 89,
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Cat-Eye Fashion Glasses',
    brand: 'Prada',
    price: 189.99,
    description: 'Stylish cat-eye frames that add elegance to any outfit. Premium Italian craftsmanship.',
    category: 'women',
    frame_type: 'full-rim',
    frame_shape: 'cat-eye',
    color: 'Tortoise',
    image_url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400',
    stock: 28,
    rating: 4.8,
    reviews_count: 156,
    created_at: '2024-01-25T00:00:00Z'
  },
  {
    id: '4',
    name: 'Round Wire Frame Glasses',
    brand: 'Oliver Peoples',
    price: 225.00,
    description: 'Vintage-inspired round frames with thin wire construction. Comfortable for all-day wear.',
    category: 'men',
    frame_type: 'rimless',
    frame_shape: 'round',
    color: 'Silver',
    image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    stock: 42,
    rating: 4.6,
    reviews_count: 94,
    created_at: '2024-02-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Sporty Wraparound Sunglasses',
    brand: 'Oakley',
    price: 165.00,
    description: 'High-performance sports sunglasses with polarized lenses. Ideal for outdoor activities.',
    category: 'sunglasses',
    frame_type: 'full-rim',
    frame_shape: 'rectangular',
    color: 'Matte Black',
    image_url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400',
    stock: 60,
    rating: 4.9,
    reviews_count: 203,
    created_at: '2024-02-05T00:00:00Z'
  },
  {
    id: '6',
    name: 'Kids Colorful Frames',
    brand: 'Ray-Ban Junior',
    price: 75.00,
    description: 'Fun and durable frames designed specifically for kids. Flexible and comfortable.',
    category: 'kids',
    frame_type: 'full-rim',
    frame_shape: 'round',
    color: 'Blue',
    image_url: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400',
    stock: 55,
    rating: 4.4,
    reviews_count: 67,
    created_at: '2024-02-10T00:00:00Z'
  },
  {
    id: '7',
    name: 'Oversized Square Sunglasses',
    brand: 'Gucci',
    price: 295.00,
    description: 'Luxurious oversized square sunglasses with signature logo detail. Make a bold statement.',
    category: 'women',
    frame_type: 'full-rim',
    frame_shape: 'square',
    color: 'Brown',
    image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400',
    stock: 22,
    rating: 4.7,
    reviews_count: 142,
    created_at: '2024-02-15T00:00:00Z'
  },
  {
    id: '8',
    name: 'Minimalist Titanium Frames',
    brand: 'Lindberg',
    price: 350.00,
    description: 'Ultra-lightweight titanium frames with minimalist design. Danish craftsmanship at its finest.',
    category: 'men',
    frame_type: 'rimless',
    frame_shape: 'rectangular',
    color: 'Titanium',
    image_url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400',
    stock: 18,
    rating: 4.9,
    reviews_count: 78,
    created_at: '2024-02-20T00:00:00Z'
  },
  {
    id: '9',
    name: 'Retro Wayfarer Style',
    brand: 'Ray-Ban',
    price: 139.99,
    description: 'Classic wayfarer design that never goes out of style. Available in multiple colors.',
    category: 'sunglasses',
    frame_type: 'full-rim',
    frame_shape: 'wayfarer',
    color: 'Black',
    image_url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400',
    stock: 75,
    rating: 4.8,
    reviews_count: 215,
    created_at: '2024-02-25T00:00:00Z'
  },
  {
    id: '10',
    name: 'Elegant Oval Frames',
    brand: 'Chanel',
    price: 425.00,
    description: 'Sophisticated oval frames with pearl accents. Timeless elegance for special occasions.',
    category: 'women',
    frame_type: 'full-rim',
    frame_shape: 'oval',
    color: 'Rose Gold',
    image_url: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=400',
    stock: 15,
    rating: 4.9,
    reviews_count: 89,
    created_at: '2024-03-01T00:00:00Z'
  }
];

export const mockReviews = [
  {
    id: '1',
    product_id: '1',
    product_name: 'Classic Aviator Sunglasses',
    product_brand: 'Ray-Ban',
    user_id: '1',
    user_name: 'John Doe',
    rating: 5,
    comment: 'Excellent sunglasses! The quality is outstanding and they look amazing.',
    created_at: '2024-03-10T10:30:00Z'
  },
  {
    id: '2',
    product_id: '2',
    product_name: 'Modern Rectangular Frames',
    product_brand: 'Warby Parker',
    user_id: '1',
    user_name: 'John Doe',
    rating: 4,
    comment: 'Very comfortable and stylish. Great for everyday use.',
    created_at: '2024-03-11T14:20:00Z'
  },
  {
    id: '3',
    product_id: '3',
    product_name: 'Cat-Eye Fashion Glasses',
    product_brand: 'Prada',
    user_id: '1',
    user_name: 'John Doe',
    rating: 5,
    comment: 'Love these frames! Perfect fit and the design is beautiful.',
    created_at: '2024-03-12T09:15:00Z'
  },
  {
    id: '4',
    product_id: '5',
    product_name: 'Sporty Wraparound Sunglasses',
    product_brand: 'Oakley',
    user_id: '1',
    user_name: 'John Doe',
    rating: 5,
    comment: 'Perfect for running and outdoor activities. Stays in place perfectly!',
    created_at: '2024-03-13T16:45:00Z'
  },
  {
    id: '5',
    product_id: '9',
    product_name: 'Retro Wayfarer Style',
    product_brand: 'Ray-Ban',
    user_id: '2',
    user_name: 'Admin User',
    rating: 4,
    comment: 'Classic design that never goes out of style. Very satisfied with purchase.',
    created_at: '2024-03-14T11:30:00Z'
  }
];

export const mockOrders = [
  {
    id: 'ord_1a2b3c4d5e6f7g8h',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    total_amount: 244.99,
    payment_status: 'paid',
    order_status: 'delivered',
    shipping_address: '123 Main St, Apt 4B\nNew York, NY 10001\nUSA',
    tracking_number: 'TRK1234567890',
    estimated_delivery: '2024-02-20T00:00:00Z',
    created_at: '2024-02-15T10:30:00Z',
    updated_at: '2024-02-20T14:45:00Z',
    items: [
      {
        product_id: '1',
        product_name: 'Classic Aviator Sunglasses',
        product_brand: 'Ray-Ban',
        product_price: 149.99,
        quantity: 1,
        subtotal: 149.99
      },
      {
        product_id: '2',
        product_name: 'Modern Rectangular Frames',
        product_brand: 'Warby Parker',
        product_price: 95.00,
        quantity: 1,
        subtotal: 95.00
      }
    ],
    tracking: [
      {
        status: 'delivered',
        description: 'Package delivered successfully',
        location: 'New York, NY',
        created_at: '2024-02-20T14:45:00Z'
      },
      {
        status: 'out_for_delivery',
        description: 'Out for delivery',
        location: 'New York Distribution Center',
        created_at: '2024-02-20T08:30:00Z'
      },
      {
        status: 'shipped',
        description: 'Package shipped from warehouse',
        location: 'Main Warehouse',
        created_at: '2024-02-16T11:00:00Z'
      },
      {
        status: 'processing',
        description: 'Order is being processed',
        location: 'Processing Center',
        created_at: '2024-02-15T10:30:00Z'
      }
    ]
  },
  {
    id: 'ord_2b3c4d5e6f7g8h9i',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    total_amount: 189.99,
    payment_status: 'paid',
    order_status: 'shipped',
    shipping_address: '123 Main St, Apt 4B\nNew York, NY 10001\nUSA',
    tracking_number: 'TRK0987654321',
    estimated_delivery: '2024-03-08T00:00:00Z',
    created_at: '2024-03-01T14:20:00Z',
    updated_at: '2024-03-05T09:15:00Z',
    items: [
      {
        product_id: '3',
        product_name: 'Cat-Eye Fashion Glasses',
        product_brand: 'Prada',
        product_price: 189.99,
        quantity: 1,
        subtotal: 189.99
      }
    ],
    tracking: [
      {
        status: 'shipped',
        description: 'Package shipped from warehouse',
        location: 'Main Warehouse',
        created_at: '2024-03-05T09:15:00Z'
      },
      {
        status: 'confirmed',
        description: 'Order confirmed and ready to ship',
        location: 'Processing Center',
        created_at: '2024-03-02T10:00:00Z'
      },
      {
        status: 'processing',
        description: 'Order is being processed',
        location: 'Processing Center',
        created_at: '2024-03-01T14:20:00Z'
      }
    ]
  },
  {
    id: 'ord_3c4d5e6f7g8h9i0j',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    total_amount: 425.00,
    payment_status: 'pending',
    order_status: 'processing',
    shipping_address: '456 Office Blvd, Suite 200\nNew York, NY 10002\nUSA',
    tracking_number: null,
    estimated_delivery: null,
    created_at: '2024-03-15T09:15:00Z',
    updated_at: '2024-03-15T09:15:00Z',
    items: [
      {
        product_id: '10',
        product_name: 'Elegant Oval Frames',
        product_brand: 'Chanel',
        product_price: 425.00,
        quantity: 1,
        subtotal: 425.00
      }
    ],
    tracking: [
      {
        status: 'processing',
        description: 'Order received and being processed',
        location: 'Processing Center',
        created_at: '2024-03-15T09:15:00Z'
      }
    ]
  },
  {
    id: 'ord_4d5e6f7g8h9i0j1k',
    user_id: '2',
    user_name: 'Admin User',
    user_email: 'admin@lenskart.com',
    user_phone: '+1234567891',
    total_amount: 139.99,
    payment_status: 'failed',
    order_status: 'cancelled',
    shipping_address: '456 Admin Ave, City, State 12345',
    tracking_number: null,
    estimated_delivery: null,
    created_at: '2024-03-10T16:45:00Z',
    updated_at: '2024-03-10T16:46:00Z',
    items: [
      {
        product_id: '9',
        product_name: 'Retro Wayfarer Style',
        product_brand: 'Ray-Ban',
        product_price: 139.99,
        quantity: 1,
        subtotal: 139.99
      }
    ],
    tracking: [
      {
        status: 'cancelled',
        description: 'Order cancelled due to payment failure',
        location: 'System',
        created_at: '2024-03-10T16:46:00Z'
      }
    ]
  },
  {
    id: 'ord_5e6f7g8h9i0j1k2l',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    total_amount: 295.00,
    payment_status: 'refunded',
    order_status: 'cancelled',
    shipping_address: '123 Main St, Apt 4B\nNew York, NY 10001\nUSA',
    tracking_number: 'TRK5555666677',
    estimated_delivery: null,
    created_at: '2024-02-28T11:00:00Z',
    updated_at: '2024-03-05T13:30:00Z',
    items: [
      {
        product_id: '7',
        product_name: 'Oversized Square Sunglasses',
        product_brand: 'Gucci',
        product_price: 295.00,
        quantity: 1,
        subtotal: 295.00
      }
    ],
    tracking: [
      {
        status: 'cancelled',
        description: 'Order cancelled and refunded upon customer request',
        location: 'System',
        created_at: '2024-03-05T13:30:00Z'
      },
      {
        status: 'shipped',
        description: 'Package returned',
        location: 'Main Warehouse',
        created_at: '2024-03-03T10:00:00Z'
      }
    ]
  }
];

export const mockAddresses = [
  {
    id: '1',
    user_id: '1',
    label: 'Home',
    full_address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    country: 'USA',
    is_default: 1,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: '1',
    label: 'Work',
    full_address: '456 Office Blvd',
    city: 'New York',
    state: 'NY',
    zip_code: '10002',
    country: 'USA',
    is_default: 0,
    created_at: '2024-01-15T00:00:00Z'
  }
];

export const mockCart = [
  {
    id: '1',
    user_id: '1',
    product_id: '1',
    quantity: 2,
    added_at: '2024-03-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: '1',
    product_id: '2',
    quantity: 1,
    added_at: '2024-03-02T00:00:00Z'
  }
];

export const mockWishlist = [
  {
    id: '1',
    user_id: '1',
    product_id: '3',
    added_at: '2024-03-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: '1',
    product_id: '7',
    added_at: '2024-03-02T00:00:00Z'
  },
  {
    id: '3',
    user_id: '1',
    product_id: '10',
    added_at: '2024-03-03T00:00:00Z'
  }
];

export const mockRecentlyViewed = [];

export const mockCoupons = [
  {
    id: '1',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 50,
    max_discount: 20,
    valid_from: '2024-01-01T00:00:00Z',
    valid_until: '2024-12-31T23:59:59Z',
    usage_limit: 100,
    used_count: 15,
    is_active: 1,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'SAVE20',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_value: 100,
    max_discount: 50,
    valid_from: '2024-01-01T00:00:00Z',
    valid_until: '2024-12-31T23:59:59Z',
    usage_limit: 50,
    used_count: 8,
    is_active: 1,
    created_at: '2024-01-15T00:00:00Z'
  }
];

export const mockProductImages = {
  '1': [
    { id: '1', product_id: '1', image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', display_order: 1, is_primary: true },
    { id: '2', product_id: '1', image_url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400', display_order: 2, is_primary: false }
  ],
  '2': [
    { id: '3', product_id: '2', image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400', display_order: 1, is_primary: true }
  ]
};

// Mock payments data
export const mockPayments = [
  {
    session_id: 'cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    amount: 244.99,
    currency: 'INR',
    payment_status: 'paid',
    status: 'completed',
    created_at: '2024-02-15T10:30:00Z',
    updated_at: '2024-02-15T10:31:00Z'
  },
  {
    session_id: 'cs_test_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    amount: 189.99,
    currency: 'INR',
    payment_status: 'paid',
    status: 'completed',
    created_at: '2024-03-01T14:20:00Z',
    updated_at: '2024-03-01T14:21:00Z'
  },
  {
    session_id: 'cs_test_c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    amount: 425.00,
    currency: 'INR',
    payment_status: 'pending',
    status: 'pending',
    created_at: '2024-03-15T09:15:00Z',
    updated_at: '2024-03-15T09:15:00Z'
  },
  {
    session_id: 'cs_test_d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
    user_id: '2',
    user_name: 'Admin User',
    user_email: 'admin@lenskart.com',
    user_phone: '+1234567891',
    amount: 139.99,
    currency: 'INR',
    payment_status: 'failed',
    status: 'failed',
    created_at: '2024-03-10T16:45:00Z',
    updated_at: '2024-03-10T16:46:00Z'
  },
  {
    session_id: 'cs_test_e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4',
    user_id: '1',
    user_name: 'John Doe',
    user_email: 'user@example.com',
    user_phone: '+1234567890',
    amount: 295.00,
    currency: 'INR',
    payment_status: 'refunded',
    status: 'refunded',
    created_at: '2024-02-28T11:00:00Z',
    updated_at: '2024-03-05T13:30:00Z'
  }
];

// Mock analytics data
export const mockAnalytics = {
  sales: {
    summary: {
      total_orders: 15,
      total_revenue: 2459.85,
      average_order_value: 163.99
    },
    daily_sales: [
      { date: '2024-03-01', total_orders: 2, total_revenue: 434.98 },
      { date: '2024-03-02', total_orders: 1, total_revenue: 189.99 },
      { date: '2024-03-03', total_orders: 3, total_revenue: 624.97 },
      { date: '2024-03-04', total_orders: 1, total_revenue: 95.00 },
      { date: '2024-03-05', total_orders: 2, total_revenue: 369.98 },
      { date: '2024-03-06', total_orders: 0, total_revenue: 0 },
      { date: '2024-03-07', total_orders: 1, total_revenue: 149.99 },
      { date: '2024-03-08', total_orders: 2, total_revenue: 289.98 },
      { date: '2024-03-09', total_orders: 1, total_revenue: 75.00 },
      { date: '2024-03-10', total_orders: 2, total_revenue: 229.96 }
    ]
  },
  top_products: [
    {
      product_id: '9',
      product_name: 'Retro Wayfarer Style',
      brand: 'Ray-Ban',
      category: 'sunglasses',
      image_url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400',
      quantity_sold: 8,
      total_revenue: 1119.92
    },
    {
      product_id: '5',
      product_name: 'Sporty Wraparound Sunglasses',
      brand: 'Oakley',
      category: 'sunglasses',
      image_url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400',
      quantity_sold: 6,
      total_revenue: 990.00
    },
    {
      product_id: '1',
      product_name: 'Classic Aviator Sunglasses',
      brand: 'Ray-Ban',
      category: 'sunglasses',
      image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
      quantity_sold: 5,
      total_revenue: 749.95
    },
    {
      product_id: '3',
      product_name: 'Cat-Eye Fashion Glasses',
      brand: 'Prada',
      category: 'women',
      image_url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400',
      quantity_sold: 4,
      total_revenue: 759.96
    },
    {
      product_id: '2',
      product_name: 'Modern Rectangular Frames',
      brand: 'Warby Parker',
      category: 'men',
      image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400',
      quantity_sold: 4,
      total_revenue: 380.00
    }
  ],
  revenue: {
    revenue_by_category: [
      { category: 'sunglasses', revenue: 2859.87 },
      { category: 'men', revenue: 1045.00 },
      { category: 'women', revenue: 1144.95 },
      { category: 'kids', revenue: 225.00 }
    ],
    revenue_by_payment_status: [
      { status: 'paid', revenue: 4549.82 },
      { status: 'pending', revenue: 425.00 },
      { status: 'failed', revenue: 0 },
      { status: 'refunded', revenue: 300.00 }
    ]
  }
};

// Mock inventory alerts
export const mockInventoryAlerts = {
  low_stock_threshold: 30,
  alerts: [
    {
      product_id: '8',
      product_name: 'Minimalist Titanium Frames',
      brand: 'Lindberg',
      category: 'men',
      current_stock: 18,
      image_url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400',
      alert_level: 'low'
    },
    {
      product_id: '10',
      product_name: 'Elegant Oval Frames',
      brand: 'Chanel',
      category: 'women',
      current_stock: 15,
      image_url: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=400',
      alert_level: 'warning'
    },
    {
      product_id: '7',
      product_name: 'Oversized Square Sunglasses',
      brand: 'Gucci',
      category: 'women',
      current_stock: 22,
      image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400',
      alert_level: 'low'
    }
  ]
};

// Mock state management
let currentUser = null;
let currentCart = [...mockCart];
let currentWishlist = [...mockWishlist];
let currentSavedItems = []; // Saved for later items
let currentRecentlyViewed = [...mockRecentlyViewed];
let currentOrders = [...mockOrders];
let currentAddresses = [...mockAddresses];
let currentReviews = [...mockReviews];
let currentProducts = [...mockProducts];
let currentCoupons = [...mockCoupons];
let currentProductImages = { ...mockProductImages };
let currentPayments = [...mockPayments];
let currentUsers = [...mockUsers];
let currentAnalytics = JSON.parse(JSON.stringify(mockAnalytics));
let currentInventory = JSON.parse(JSON.stringify(mockInventoryAlerts));

export const getMockState = () => ({
  currentUser,
  currentCart,
  currentWishlist,
  currentSavedItems,
  currentRecentlyViewed,
  currentOrders,
  currentAddresses,
  currentReviews,
  currentProducts,
  currentCoupons,
  currentProductImages,
  currentPayments,
  currentUsers,
  currentAnalytics,
  currentInventory
});

export const setMockState = (key, value) => {
  switch(key) {
    case 'currentUser':
      currentUser = value;
      break;
    case 'currentCart':
      currentCart = value;
      break;
    case 'currentWishlist':
      currentWishlist = value;
      break;
    case 'currentSavedItems':
      currentSavedItems = value;
      break;
    case 'currentRecentlyViewed':
      currentRecentlyViewed = value;
      break;
    case 'currentOrders':
      currentOrders = value;
      break;
    case 'currentAddresses':
      currentAddresses = value;
      break;
    case 'currentReviews':
      currentReviews = value;
      break;
    case 'currentProducts':
      currentProducts = value;
      break;
    case 'currentCoupons':
      currentCoupons = value;
      break;
    case 'currentProductImages':
      currentProductImages = value;
      break;
    case 'currentPayments':
      currentPayments = value;
      break;
    case 'currentUsers':
      currentUsers = value;
      break;
    case 'currentAnalytics':
      currentAnalytics = value;
      break;
    case 'currentInventory':
      currentInventory = value;
      break;
    default:
      break;
  }
};

export const resetMockState = () => {
  currentUser = null;
  currentCart = [];
  currentWishlist = [];
  currentSavedItems = [];
  currentRecentlyViewed = [];
  currentOrders = [...mockOrders];
  currentAddresses = [...mockAddresses];
  currentReviews = [...mockReviews];
  currentProducts = [...mockProducts];
  currentCoupons = [...mockCoupons];
  currentProductImages = { ...mockProductImages };
  currentPayments = [...mockPayments];
  currentUsers = [...mockUsers];
  currentAnalytics = JSON.parse(JSON.stringify(mockAnalytics));
  currentInventory = JSON.parse(JSON.stringify(mockInventoryAlerts));
};