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
    user_id: '1',
    user_name: 'John Doe',
    rating: 5,
    comment: 'Excellent sunglasses! The quality is outstanding and they look amazing.',
    created_at: '2024-03-10T00:00:00Z'
  },
  {
    id: '2',
    product_id: '2',
    user_id: '1',
    user_name: 'John Doe',
    rating: 4,
    comment: 'Very comfortable and stylish. Great for everyday use.',
    created_at: '2024-03-11T00:00:00Z'
  },
  {
    id: '3',
    product_id: '3',
    user_id: '1',
    user_name: 'John Doe',
    rating: 5,
    comment: 'Love these frames! Perfect fit and the design is beautiful.',
    created_at: '2024-03-12T00:00:00Z'
  }
];

export const mockOrders = [
  {
    id: '1',
    user_id: '1',
    total_amount: 244.99,
    payment_status: 'paid',
    order_status: 'delivered',
    shipping_address: '123 Main St, City, State 12345',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    items: [
      {
        product_id: '1',
        product_name: 'Classic Aviator Sunglasses',
        quantity: 1,
        price: 149.99
      },
      {
        product_id: '2',
        product_name: 'Modern Rectangular Frames',
        quantity: 1,
        price: 95.00
      }
    ]
  },
  {
    id: '2',
    user_id: '1',
    total_amount: 189.99,
    payment_status: 'paid',
    order_status: 'shipped',
    shipping_address: '123 Main St, City, State 12345',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-05T00:00:00Z',
    items: [
      {
        product_id: '3',
        product_name: 'Cat-Eye Fashion Glasses',
        quantity: 1,
        price: 189.99
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
    { id: '1', product_id: '1', image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', display_order: 1 },
    { id: '2', product_id: '1', image_url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400', display_order: 2 }
  ],
  '2': [
    { id: '3', product_id: '2', image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400', display_order: 1 }
  ]
};

// Mock state management
let currentUser = null;
let currentCart = [...mockCart];
let currentWishlist = [...mockWishlist];
let currentRecentlyViewed = [...mockRecentlyViewed];
let currentOrders = [...mockOrders];
let currentAddresses = [...mockAddresses];
let currentReviews = [...mockReviews];
let currentProducts = [...mockProducts];
let currentCoupons = [...mockCoupons];
let currentProductImages = { ...mockProductImages };

export const getMockState = () => ({
  currentUser,
  currentCart,
  currentWishlist,
  currentRecentlyViewed,
  currentOrders,
  currentAddresses,
  currentReviews,
  currentProducts,
  currentCoupons,
  currentProductImages
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
    default:
      break;
  }
};

export const resetMockState = () => {
  currentUser = null;
  currentCart = [];
  currentWishlist = [];
  currentRecentlyViewed = [];
  currentOrders = [...mockOrders];
  currentAddresses = [...mockAddresses];
  currentReviews = [...mockReviews];
  currentProducts = [...mockProducts];
  currentCoupons = [...mockCoupons];
  currentProductImages = { ...mockProductImages };
};