#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Build a LensKart-like e-commerce website with admin and user roles. User registration page for users only, fixed admin credentials for security. Full payment gateway integration with Stripe. Include all LensKart features. Use MongoDB database with easy migration to MySQL via .env file."

backend:
  - task: "User Registration API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "User registration implemented with email, password (bcrypt hashed), name, phone, address fields. Returns JWT token on successful registration."

  - task: "User & Admin Login API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Login API implemented with fixed admin credentials (admin@lenskart.com / Admin@123) and regular user login with password verification. Returns JWT token."

  - task: "JWT Authentication Middleware"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "JWT token verification implemented using get_current_user helper function. Checks Bearer token in Authorization header."

  - task: "Product CRUD APIs"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Complete product management APIs: GET /api/products (list with filters), GET /api/products/{id} (single), POST (create - admin only), PUT (update - admin only), DELETE (delete - admin only). Product model includes: name, brand, price, description, category, frame_type, frame_shape, color, image_url, stock."

  - task: "Shopping Cart APIs"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Cart APIs implemented: GET /api/cart (get user cart with product details), POST /api/cart (add item), DELETE /api/cart/{product_id} (remove item), DELETE /api/cart (clear cart). Cart items stored per user in MongoDB."

  - task: "Order Management APIs"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Order APIs implemented: POST /api/orders (create order from cart), GET /api/orders (list orders - user sees own, admin sees all), GET /api/orders/{id} (get specific order). Orders include: user_id, items, total_amount, payment_status, order_status, shipping_address. Note: Currently orders are created via payment flow, not directly."

  - task: "Stripe Payment Integration"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Stripe payment integration completed using emergentintegrations library. POST /api/payment/checkout creates Stripe session with dynamic URLs. GET /api/payment/status/{session_id} polls payment status. POST /api/webhook/stripe handles webhooks. Payment flow: create session -> redirect to Stripe -> poll status -> create order on success -> clear cart. Uses test Stripe key (sk_test_emergent). CRITICAL: Needs end-to-end testing with Stripe test cards."

  - task: "Admin Statistics API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "GET /api/admin/stats returns dashboard statistics: total_products, total_orders, total_users, total_revenue (sum of paid orders). Admin-only route."

  - task: "Database Seeding Script"
    implemented: true
    working: true
    file: "/app/scripts/seed_data.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Created seed_data.py script that populates database with 10 sample products (various categories: men, women, kids, sunglasses). Script executed successfully."

frontend:
  - task: "Authentication Pages (Login/Register)"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Login.js, /app/frontend/src/pages/Register.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Login and Register pages implemented with form validation, error handling, toast notifications. Login shows admin credentials hint. Both pages have glassmorphism design with gradient accents. Successfully redirect after login/registration."

  - task: "Home/Landing Page"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Home.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Landing page with hero section, features showcase, CTA sections. Gradient background, responsive design, navigation with login/register buttons or user menu based on auth state. Screenshot verified - page loads correctly."

  - task: "Products Listing Page"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Products.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Products page with grid layout, search bar, category filters (All, Men, Women, Kids, Sunglasses). Product cards with image, brand, name, price, add to cart button. Hover effects and animations implemented. Needs testing for filters and search functionality."

  - task: "Product Detail Page"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/ProductDetail.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Product detail page showing large product image, full specifications (category, frame type, frame shape, color), stock status, add to cart button. Needs testing for add to cart functionality and navigation."

  - task: "Shopping Cart Page"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Cart.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Cart page with cart items list, product images, quantities, remove buttons. Order summary card with subtotal, shipping (free), total. 'Proceed to Checkout' button initiates Stripe payment flow. Empty cart state implemented. Needs testing for cart operations and checkout flow."

  - task: "Payment Success Page"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/PaymentSuccess.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Payment success page with status polling mechanism. Polls payment status every 2 seconds for max 5 attempts. Shows success/failure/processing states. Displays amount paid, provides links to orders and continue shopping. CRITICAL: Needs testing with actual Stripe payment flow."

  - task: "Orders Page"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Orders.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Orders page displaying order history with order ID, date, items, total amount, payment status, order status, shipping address. Status badges with color coding. Empty state for no orders. Needs testing to verify orders appear after successful payment."

  - task: "Admin Dashboard"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin dashboard with statistics cards (products, orders, users, revenue), product management table with edit/delete actions, add product dialog with full form, recent orders list. All CRUD operations for products implemented. Needs testing for admin functionality."

  - task: "Navigation & Routing"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "React Router setup with all routes: /, /login, /register, /products, /products/:id, /cart, /orders, /admin, /payment-success. Protected routes for authenticated users and admin-only routes. Axios instance configured with token interceptor."

  - task: "Cart Count Indicator"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Cart count badge in navigation showing number of items. Updates when items added/removed. Needs testing to verify real-time updates."

  - task: "UI Components & Styling"
    implemented: true
    working: true
    file: "/app/frontend/src/App.css, /app/frontend/src/index.css"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Modern UI with gradient theme (blue to purple), glassmorphism effects, smooth animations, responsive design. All Shadcn/UI components integrated. Custom scrollbar, fade-in animations, product card hover effects implemented."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false
  last_updated: "2025-11-12"

test_plan:
  current_focus:
    - "Stripe Payment Integration"
    - "Payment Success Page"
    - "Orders Page"
    - "Admin Dashboard"
    - "Products Listing Page"
    - "Shopping Cart Page"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"
  notes: "MVP completed. Main focus should be on payment flow testing as it's the most critical feature. Test with Stripe test cards: 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline)."

agent_communication:
  - agent: "main"
    message: "MVP development complete. All backend APIs implemented with JWT authentication, MongoDB integration, and Stripe payment. Frontend has all pages: home, login, register, products listing, product detail, cart, orders, payment success, and admin dashboard. Design uses modern gradient theme with glassmorphism effects. 10 sample products seeded in database. Admin credentials: admin@lenskart.com / Admin@123. Project zip file created at /app/lenskart-project.zip. NEXT STEPS: (1) Test complete payment flow end-to-end with Stripe test cards, (2) Verify order creation after payment, (3) Test cart clearing after payment, (4) Test all admin CRUD operations, (5) Test product filters and search. All tasks marked 'NA' for working status need comprehensive testing."

development_roadmap_phases:

  #============================================================================
  # PHASE 1: MVP - CORE E-COMMERCE (✅ COMPLETED)
  #============================================================================
  phase_1_mvp:
    status: "COMPLETED"
    completion_date: "2025-11-12"
    
    backend_tasks:
      - task: "User Registration API"
        status: "✅ DONE"
        endpoint: "POST /api/auth/register"
        
      - task: "User & Admin Login API"
        status: "✅ DONE"
        endpoint: "POST /api/auth/login"
        
      - task: "JWT Authentication Middleware"
        status: "✅ DONE"
        
      - task: "Product CRUD APIs"
        status: "✅ DONE"
        endpoints: "GET/POST/PUT/DELETE /api/products"
        
      - task: "Shopping Cart APIs"
        status: "✅ DONE"
        endpoints: "GET/POST/DELETE /api/cart"
        
      - task: "Order Management APIs"
        status: "✅ DONE"
        endpoints: "GET/POST /api/orders"
        
      - task: "Stripe Payment Integration"
        status: "✅ DONE"
        endpoints: "POST /api/payment/checkout, GET /api/payment/status/{id}, POST /api/webhook/stripe"
        
      - task: "Admin Statistics API"
        status: "✅ DONE"
        endpoint: "GET /api/admin/stats"
    
    frontend_tasks:
      - task: "Home/Landing Page"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/Home.js"
        
      - task: "Login & Register Pages"
        status: "✅ DONE"
        files: "/app/frontend/src/pages/Login.js, Register.js"
        
      - task: "Products Listing Page"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/Products.js"
        
      - task: "Product Detail Page"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/ProductDetail.js"
        
      - task: "Shopping Cart Page"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/Cart.js"
        
      - task: "Payment Success Page"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/PaymentSuccess.js"
        
      - task: "Orders History Page"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/Orders.js"
        
      - task: "Admin Dashboard"
        status: "✅ DONE"
        file: "/app/frontend/src/pages/AdminDashboard.js"
        
      - task: "Navigation & Routing Setup"
        status: "✅ DONE"
        file: "/app/frontend/src/App.js"
        
      - task: "Cart Count Indicator"
        status: "✅ DONE"
    
    testing_required:
      - "Test complete payment flow with Stripe test cards"
      - "Verify order creation after successful payment"
      - "Test all admin CRUD operations"
      - "Test product filters and search"

  #============================================================================
  # PHASE 2: USER EXPERIENCE ENHANCEMENTS
  #============================================================================
  phase_2_ux_enhancements:
    status: "PENDING"
    priority: "HIGH"
    estimated_effort: "2-3 days"
    
    backend_tasks:
      - task: "User Profile APIs"
        status: "❌ TODO"
        description: "Get and update user profile information"
        endpoints:
          - "GET /api/user/profile - Get current user profile"
          - "PUT /api/user/profile - Update profile (name, phone)"
          - "PUT /api/user/password - Change password"
        file: "/app/backend/server.py"
        
      - task: "Address Management APIs"
        status: "❌ TODO"
        description: "Multiple shipping addresses per user"
        endpoints:
          - "GET /api/user/addresses - List all addresses"
          - "POST /api/user/addresses - Add new address"
          - "PUT /api/user/addresses/{id} - Update address"
          - "DELETE /api/user/addresses/{id} - Delete address"
          - "PUT /api/user/addresses/{id}/default - Set default address"
        database_changes:
          - "Create 'addresses' collection with: id, user_id, label, full_address, city, state, zip, country, is_default"
        
      - task: "Advanced Product Filter APIs"
        status: "❌ TODO"
        description: "Enhanced filtering and sorting"
        endpoints:
          - "GET /api/products/filters - Get available filter options (brands, price range, colors)"
          - "GET /api/products?sort=price_asc|price_desc|newest|popular"
          - "GET /api/products?min_price=X&max_price=Y"
          - "GET /api/products?brands[]=Brand1&brands[]=Brand2"
          - "GET /api/products?colors[]=Black&colors[]=Blue"
        
      - task: "Cart Quantity Update API"
        status: "❌ TODO"
        description: "Update cart item quantity"
        endpoints:
          - "PATCH /api/cart/{item_id} - Update quantity"
        
      - task: "Stock Management"
        status: "❌ TODO"
        description: "Reduce stock after order, check availability"
        changes:
          - "Reduce product stock when order is placed"
          - "Check stock availability before adding to cart"
          - "Return stock if order is cancelled"
        
      - task: "Order Detail Enhancement"
        status: "❌ TODO"
        description: "Add shipping address selection to order"
        changes:
          - "Accept address_id in order creation"
          - "Store full address details in order"
    
    frontend_tasks:
      - task: "User Profile Page"
        status: "❌ TODO"
        description: "View and edit user profile"
        file: "/app/frontend/src/pages/Profile.js"
        features:
          - "Display user info (name, email, phone)"
          - "Edit profile form"
          - "Change password section"
          - "Navigation link in user menu"
        
      - task: "Address Management Page"
        status: "❌ TODO"
        description: "Manage multiple shipping addresses"
        file: "/app/frontend/src/pages/Addresses.js"
        features:
          - "List all saved addresses"
          - "Add new address form (modal/page)"
          - "Edit address"
          - "Delete address with confirmation"
          - "Set default address"
          - "Address cards with labels (Home, Work, etc)"
        
      - task: "Advanced Product Filters UI"
        status: "❌ TODO"
        description: "Enhanced filtering sidebar/panel"
        file: "/app/frontend/src/pages/Products.js"
        features:
          - "Price range slider (min-max)"
          - "Brand checkbox list"
          - "Color checkbox list"
          - "Frame type filter"
          - "Frame shape filter"
          - "Clear all filters button"
          - "Active filter tags"
          - "Filter count indicators"
        
      - task: "Product Sorting Dropdown"
        status: "❌ TODO"
        description: "Sort products by various criteria"
        file: "/app/frontend/src/pages/Products.js"
        options:
          - "Featured (default)"
          - "Price: Low to High"
          - "Price: High to Low"
          - "Newest First"
          - "Best Selling"
        
      - task: "Cart Quantity Editor"
        status: "❌ TODO"
        description: "Edit quantity directly in cart"
        file: "/app/frontend/src/pages/Cart.js"
        features:
          - "Plus/minus buttons for quantity"
          - "Direct input field for quantity"
          - "Update total price in real-time"
          - "Disable if stock insufficient"
        
      - task: "Address Selection in Checkout"
        status: "❌ TODO"
        description: "Select shipping address during checkout"
        file: "/app/frontend/src/pages/Cart.js"
        features:
          - "List saved addresses"
          - "Select address for order"
          - "Add new address option"
          - "Show selected address in order summary"
        
      - task: "Stock Availability Indicators"
        status: "❌ TODO"
        description: "Show stock status throughout app"
        locations:
          - "Product card: 'Only X left' badge"
          - "Product detail: Stock status prominently"
          - "Cart: Warn if item out of stock"
          - "Disable add to cart if out of stock"
        
      - task: "Responsive Mobile Navigation"
        status: "❌ TODO"
        description: "Hamburger menu for mobile devices"
        file: "/app/frontend/src/components/Navigation.js"
        features:
          - "Hamburger icon on mobile"
          - "Slide-out menu"
          - "Mobile-friendly menu items"
          - "Close on route change"

  #============================================================================
  # PHASE 3: CUSTOMER ENGAGEMENT
  #============================================================================
  phase_3_customer_engagement:
    status: "PENDING"
    priority: "MEDIUM"
    estimated_effort: "3-4 days"
    
    backend_tasks:
      - task: "Product Reviews & Ratings APIs"
        status: "❌ TODO"
        description: "Customer reviews and star ratings"
        endpoints:
          - "GET /api/products/{id}/reviews - Get product reviews"
          - "POST /api/products/{id}/reviews - Add review (authenticated)"
          - "PUT /api/reviews/{id} - Update own review"
          - "DELETE /api/reviews/{id} - Delete own review"
          - "GET /api/products/{id}/rating - Get average rating"
        database_changes:
          - "Create 'reviews' collection: id, product_id, user_id, rating (1-5), title, comment, helpful_count, created_at, updated_at"
          - "Add 'average_rating' and 'review_count' fields to products"
        
      - task: "Wishlist APIs"
        status: "❌ TODO"
        description: "Save products to wishlist"
        endpoints:
          - "GET /api/wishlist - Get user's wishlist"
          - "POST /api/wishlist - Add product to wishlist"
          - "DELETE /api/wishlist/{product_id} - Remove from wishlist"
          - "POST /api/wishlist/move-to-cart - Move all to cart"
        database_changes:
          - "Create 'wishlist' collection: id, user_id, product_id, added_at"
        
      - task: "Product Images APIs"
        status: "❌ TODO"
        description: "Multiple images per product"
        endpoints:
          - "GET /api/products/{id}/images - Get all images"
          - "POST /api/products/{id}/images - Upload image (admin)"
          - "DELETE /api/products/{id}/images/{image_id} - Delete image (admin)"
          - "PUT /api/products/{id}/images/{image_id}/primary - Set primary image"
        database_changes:
          - "Create 'product_images' collection: id, product_id, image_url, is_primary, display_order"
          - "Remove 'image_url' from products, use product_images instead"
        
      - task: "Order Tracking APIs"
        status: "❌ TODO"
        description: "Detailed order status tracking"
        endpoints:
          - "GET /api/orders/{id}/tracking - Get order tracking history"
          - "PUT /api/orders/{id}/status - Update order status (admin)"
        database_changes:
          - "Add 'tracking_number', 'carrier', 'estimated_delivery' to orders"
          - "Create 'order_tracking' collection: id, order_id, status, message, timestamp"
          - "Status values: pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, refunded"
        
      - task: "Email Notification Service"
        status: "❌ TODO"
        description: "Send emails for various events"
        endpoints:
          - "Internal service, no direct endpoints"
        events:
          - "Welcome email on registration"
          - "Order confirmation email"
          - "Payment receipt email"
          - "Shipping notification email"
          - "Delivery confirmation email"
          - "Password reset email"
        requirements:
          - "Set up email provider (SendGrid, AWS SES, etc)"
          - "Email templates"
          - "Queue system for async sending"
        
      - task: "Recently Viewed Products"
        status: "❌ TODO"
        description: "Track and show recently viewed products"
        endpoints:
          - "GET /api/user/recently-viewed - Get recently viewed products"
          - "POST /api/user/recently-viewed/{product_id} - Track view"
        database_changes:
          - "Create 'recently_viewed' collection: user_id, product_id, viewed_at"
          - "Limit to last 20 items per user"
        
      - task: "Product Recommendations API"
        status: "❌ TODO"
        description: "Recommend products based on behavior"
        endpoints:
          - "GET /api/products/recommended - Get personalized recommendations"
          - "GET /api/products/{id}/related - Get related products"
        logic:
          - "Based on: recently viewed, cart items, order history"
          - "Simple: same category, similar price range"
          - "Advanced: collaborative filtering (future)"
    
    frontend_tasks:
      - task: "Product Reviews & Ratings UI"
        status: "❌ TODO"
        description: "Display and submit reviews"
        file: "/app/frontend/src/pages/ProductDetail.js"
        features:
          - "Star rating display (average)"
          - "Review count"
          - "Reviews list with pagination"
          - "Write review form (modal)"
          - "Star rating input"
          - "Review sorting (newest, highest rated, helpful)"
          - "Helpful button for reviews"
          - "Edit/delete own reviews"
        
      - task: "Wishlist Page"
        status: "❌ TODO"
        description: "View and manage wishlist"
        file: "/app/frontend/src/pages/Wishlist.js"
        features:
          - "Grid layout of wishlist items"
          - "Heart icon to add/remove from wishlist"
          - "Heart icon in product cards"
          - "Heart icon in product detail"
          - "Move to cart button"
          - "Remove from wishlist button"
          - "Empty wishlist state"
          - "Wishlist count in navigation"
        
      - task: "Product Image Gallery"
        status: "❌ TODO"
        description: "Multiple product images carousel"
        file: "/app/frontend/src/pages/ProductDetail.js"
        features:
          - "Main large image"
          - "Thumbnail images below/side"
          - "Click thumbnail to change main image"
          - "Zoom on hover/click"
          - "Arrow navigation"
          - "Image indicators/dots"
        
      - task: "Order Tracking Page"
        status: "❌ TODO"
        description: "Detailed order tracking"
        file: "/app/frontend/src/pages/OrderTracking.js"
        features:
          - "Order status timeline"
          - "Tracking number display"
          - "Carrier information"
          - "Estimated delivery date"
          - "Status history with timestamps"
          - "Track order button in orders page"
        
      - task: "Recently Viewed Section"
        status: "❌ TODO"
        description: "Show recently viewed products"
        locations:
          - "Home page section"
          - "Product detail page section"
        features:
          - "Horizontal scrollable carousel"
          - "Show last 10 viewed products"
          - "Link to product detail"
        
      - task: "Product Recommendations Section"
        status: "❌ TODO"
        description: "Recommended products"
        locations:
          - "Home page: 'Recommended for You'"
          - "Product detail: 'You May Also Like'"
          - "Cart page: 'Frequently Bought Together'"
        features:
          - "Product carousel"
          - "Quick add to cart"
        
      - task: "Password Reset Flow"
        status: "❌ TODO"
        description: "Forgot password functionality"
        files: "/app/frontend/src/pages/ForgotPassword.js, ResetPassword.js"
        features:
          - "Forgot password link on login"
          - "Email input form"
          - "Reset link sent confirmation"
          - "Reset password form with token"
          - "Password strength indicator"

  #============================================================================
  # PHASE 4: ADVANCED FEATURES
  #============================================================================
  phase_4_advanced_features:
    status: "PENDING"
    priority: "LOW"
    estimated_effort: "4-5 days"
    
    backend_tasks:
      - task: "Discount Codes & Coupons APIs"
        status: "❌ TODO"
        description: "Promotional codes and discounts"
        endpoints:
          - "POST /api/coupons/validate - Validate coupon code"
          - "POST /api/orders/apply-coupon - Apply coupon to cart"
          - "GET /api/admin/coupons - List all coupons (admin)"
          - "POST /api/admin/coupons - Create coupon (admin)"
          - "PUT /api/admin/coupons/{id} - Update coupon (admin)"
          - "DELETE /api/admin/coupons/{id} - Delete coupon (admin)"
        database_changes:
          - "Create 'coupons' collection: id, code, type (percentage/fixed), value, min_order_value, max_discount, start_date, end_date, usage_limit, used_count, is_active"
          - "Create 'coupon_usage' collection: id, coupon_id, user_id, order_id, discount_amount, used_at"
        
      - task: "Save for Later API"
        status: "❌ TODO"
        description: "Move cart items to saved list"
        endpoints:
          - "GET /api/saved-items - Get saved items"
          - "POST /api/cart/{item_id}/save - Move to saved"
          - "POST /api/saved-items/{id}/move-to-cart - Move to cart"
          - "DELETE /api/saved-items/{id} - Delete saved item"
        database_changes:
          - "Create 'saved_items' collection: id, user_id, product_id, saved_at"
        
      - task: "Search Suggestions API"
        status: "❌ TODO"
        description: "Autocomplete search suggestions"
        endpoints:
          - "GET /api/search/suggestions?q=query - Get suggestions"
        features:
          - "Product name matches"
          - "Brand matches"
          - "Category suggestions"
          - "Recent searches (per user)"
        
      - task: "Inventory Alerts API"
        status: "❌ TODO"
        description: "Low stock alerts for admin"
        endpoints:
          - "GET /api/admin/inventory/alerts - Get low stock products"
          - "PUT /api/admin/inventory/threshold - Set alert threshold"
        features:
          - "Alert when stock below threshold (e.g., 10 units)"
          - "Email notification to admin"
        
      - task: "Sales Analytics APIs"
        status: "❌ TODO"
        description: "Detailed sales reports"
        endpoints:
          - "GET /api/admin/analytics/sales - Sales over time"
          - "GET /api/admin/analytics/top-products - Best selling products"
          - "GET /api/admin/analytics/revenue - Revenue breakdown"
          - "GET /api/admin/analytics/customers - Customer metrics"
        features:
          - "Date range filtering"
          - "Group by: day, week, month, year"
          - "Export to CSV"
        
      - task: "Razorpay Payment Integration"
        status: "❌ TODO"
        description: "Alternative payment gateway for India"
        endpoints:
          - "POST /api/payment/razorpay/checkout - Create Razorpay order"
          - "POST /api/payment/razorpay/verify - Verify payment"
          - "POST /api/webhook/razorpay - Razorpay webhook"
        requirements:
          - "Razorpay account and API keys"
          - "Split payment configuration"
        
      - task: "User Activity Tracking"
        status: "❌ TODO"
        description: "Track user behavior for analytics"
        endpoints:
          - "POST /api/analytics/track - Track event"
        events:
          - "Page views"
          - "Product views"
          - "Add to cart"
          - "Search queries"
          - "Checkout initiated"
          - "Purchase completed"
        database_changes:
          - "Create 'user_events' collection: id, user_id, event_type, event_data, timestamp"
        
      - task: "Admin User Management APIs"
        status: "❌ TODO"
        description: "Manage users from admin panel"
        endpoints:
          - "GET /api/admin/users - List all users"
          - "GET /api/admin/users/{id} - Get user details"
          - "PUT /api/admin/users/{id} - Update user"
          - "DELETE /api/admin/users/{id} - Delete user"
          - "PUT /api/admin/users/{id}/block - Block/unblock user"
    
    frontend_tasks:
      - task: "Coupon Code Input"
        status: "❌ TODO"
        description: "Apply discount codes in cart"
        file: "/app/frontend/src/pages/Cart.js"
        features:
          - "Coupon code input field"
          - "Apply button"
          - "Show discount amount"
          - "Show final price after discount"
          - "Remove coupon option"
          - "Coupon validation errors"
        
      - task: "Save for Later UI"
        status: "❌ TODO"
        description: "Save cart items for later"
        file: "/app/frontend/src/pages/Cart.js"
        features:
          - "Save for later button on cart items"
          - "Saved items section below cart"
          - "Move to cart button"
          - "Delete saved item"
        
      - task: "Search Autocomplete"
        status: "❌ TODO"
        description: "Live search suggestions"
        file: "/app/frontend/src/components/SearchBar.js"
        features:
          - "Dropdown with suggestions"
          - "Product suggestions with images"
          - "Category suggestions"
          - "Recent searches"
          - "Clear recent searches"
          - "Keyboard navigation"
        
      - task: "Admin Sales Dashboard"
        status: "❌ TODO"
        description: "Analytics charts and reports"
        file: "/app/frontend/src/pages/admin/Analytics.js"
        features:
          - "Sales chart (line/bar)"
          - "Revenue breakdown (pie chart)"
          - "Top products table"
          - "Customer metrics cards"
          - "Date range picker"
          - "Export to CSV button"
          - "Use Chart.js or Recharts library"
        
      - task: "Admin Inventory Management"
        status: "❌ TODO"
        description: "Advanced product inventory"
        file: "/app/frontend/src/pages/admin/Inventory.js"
        features:
          - "Low stock alerts badge"
          - "Bulk update stock"
          - "Stock history log"
          - "Set alert thresholds"
        
      - task: "Admin User Management"
        status: "❌ TODO"
        description: "Manage users from admin"
        file: "/app/frontend/src/pages/admin/Users.js"
        features:
          - "Users table with search"
          - "View user details modal"
          - "Edit user information"
          - "Block/unblock user"
          - "View user orders"
          - "Delete user with confirmation"
        
      - task: "Admin Coupon Management"
        status: "❌ TODO"
        description: "Create and manage coupons"
        file: "/app/frontend/src/pages/admin/Coupons.js"
        features:
          - "Coupons list table"
          - "Create coupon form"
          - "Edit coupon"
          - "Activate/deactivate coupon"
          - "View usage statistics"
          - "Delete coupon"
        
      - task: "Razorpay Payment Option"
        status: "❌ TODO"
        description: "Alternative payment method"
        file: "/app/frontend/src/pages/Cart.js"
        features:
          - "Payment method selection (Stripe/Razorpay)"
          - "Razorpay checkout modal"
          - "Payment verification flow"
        
      - task: "Product Comparison"
        status: "❌ TODO"
        description: "Compare multiple products side-by-side"
        file: "/app/frontend/src/pages/Compare.js"
        features:
          - "Add to compare checkbox on products"
          - "Compare bar showing selected items"
          - "Compare page with side-by-side specs"
          - "Highlight differences"
          - "Max 4 products to compare"

  #============================================================================
  # PHASE 5: OPTIMIZATION & POLISH
  #============================================================================
  phase_5_optimization:
    status: "PENDING"
    priority: "LOW"
    estimated_effort: "3-4 days"
    
    backend_tasks:
      - task: "API Rate Limiting"
        status: "❌ TODO"
        description: "Prevent API abuse"
        implementation:
          - "Use slowapi or similar library"
          - "Rate limits per endpoint"
          - "Rate limits per user/IP"
          - "Return 429 status code"
        
      - task: "Request Validation Enhancement"
        status: "❌ TODO"
        description: "Stricter input validation"
        areas:
          - "Email format validation"
          - "Phone number validation"
          - "Price validation (positive numbers)"
          - "URL validation for images"
          - "XSS prevention"
          - "SQL injection prevention (already handled by MongoDB)"
        
      - task: "Database Indexing"
        status: "❌ TODO"
        description: "Optimize database queries"
        indexes:
          - "users: email (unique)"
          - "products: category, brand, price"
          - "cart: user_id"
          - "orders: user_id, created_at"
          - "reviews: product_id"
        
      - task: "Caching Layer"
        status: "❌ TODO"
        description: "Cache frequently accessed data"
        implementation:
          - "Use Redis or similar"
          - "Cache product listings"
          - "Cache product details"
          - "Cache user sessions"
          - "Set TTL appropriately"
        
      - task: "API Documentation"
        status: "❌ TODO"
        description: "Auto-generated API docs"
        implementation:
          - "FastAPI auto-generates Swagger UI"
          - "Add detailed descriptions to endpoints"
          - "Add request/response examples"
          - "Available at /docs"
        
      - task: "Logging & Monitoring"
        status: "❌ TODO"
        description: "Better error tracking"
        implementation:
          - "Structured logging (JSON)"
          - "Log levels (DEBUG, INFO, WARNING, ERROR)"
          - "Error tracking (Sentry, Rollbar)"
          - "Performance monitoring (New Relic, DataDog)"
        
      - task: "Backup & Recovery"
        status: "❌ TODO"
        description: "Database backup strategy"
        implementation:
          - "Automated daily backups"
          - "Backup retention policy"
          - "Backup to cloud storage (S3, GCS)"
          - "Restore procedure documentation"
    
    frontend_tasks:
      - task: "Performance Optimization"
        status: "❌ TODO"
        description: "Improve load times and responsiveness"
        optimizations:
          - "Code splitting by route"
          - "Lazy loading images"
          - "Optimize image sizes (WebP format)"
          - "Minimize bundle size"
          - "Use React.memo for expensive components"
          - "Debounce search input"
          - "Virtual scrolling for long lists"
        
      - task: "SEO Optimization"
        status: "❌ TODO"
        description: "Search engine optimization"
        implementation:
          - "React Helmet for meta tags"
          - "Dynamic page titles"
          - "Open Graph tags for social sharing"
          - "Sitemap.xml generation"
          - "Robots.txt"
          - "Structured data (JSON-LD)"
        
      - task: "Accessibility (A11y) Improvements"
        status: "❌ TODO"
        description: "WCAG compliance"
        improvements:
          - "Keyboard navigation"
          - "Screen reader labels"
          - "ARIA attributes"
          - "Focus indicators"
          - "Color contrast ratios"
          - "Alt text for images"
        
      - task: "Progressive Web App (PWA)"
        status: "❌ TODO"
        description: "Make app installable"
        implementation:
          - "Service worker for offline support"
          - "Web app manifest"
          - "Install prompt"
          - "Offline fallback page"
          - "Cache static assets"
        
      - task: "Error Boundary Components"
        status: "❌ TODO"
        description: "Graceful error handling"
        implementation:
          - "Top-level error boundary"
          - "Route-specific error boundaries"
          - "Fallback UI for errors"
          - "Error reporting to backend"
        
      - task: "Loading States & Skeletons"
        status: "❌ TODO"
        description: "Better loading UX"
        implementation:
          - "Skeleton screens for content loading"
          - "Shimmer effects"
          - "Progressive image loading"
          - "Spinner for button actions"
        
      - task: "Toast Notifications Enhancement"
        status: "❌ TODO"
        description: "Better user feedback"
        improvements:
          - "Success/error/warning/info variants"
          - "Action buttons in toasts"
          - "Undo functionality"
          - "Toast queue management"
          - "Position customization"
        
      - task: "Dark Mode Support"
        status: "❌ TODO"
        description: "Dark theme option"
        implementation:
          - "Theme toggle in settings"
          - "Dark color scheme"
          - "Persist theme preference"
          - "System preference detection"
        
      - task: "Internationalization (i18n)"
        status: "❌ TODO"
        description: "Multi-language support"
        implementation:
          - "Use react-i18next"
          - "Translation files"
          - "Language selector"
          - "Currency formatting"
          - "Date/time formatting"
        
      - task: "Analytics Integration"
        status: "❌ TODO"
        description: "Track user behavior"
        implementation:
          - "Google Analytics 4"
          - "Track page views"
          - "Track e-commerce events"
          - "Track conversion funnel"
          - "Custom event tracking"
        
      - task: "Comprehensive Testing"
        status: "❌ TODO"
        description: "Automated test suite"
        tests:
          - "Unit tests (Jest + React Testing Library)"
          - "Integration tests"
          - "E2E tests (Cypress/Playwright)"
          - "Component tests"
          - "API tests"
          - "Test coverage > 80%"

  #============================================================================
  # TESTING PRIORITIES (After Each Phase)
  #============================================================================
  testing_checklist:
    after_phase_1:
      - "✅ Test user registration and login"
      - "🔄 Test payment flow with Stripe test cards"
      - "🔄 Test order creation after payment"
      - "🔄 Test admin CRUD operations"
      - "🔄 Test product filters and search"
    
    after_phase_2:
      - "Test user profile update"
      - "Test address management (add/edit/delete)"
      - "Test advanced product filters"
      - "Test product sorting"
      - "Test cart quantity editing"
      - "Test address selection in checkout"
      - "Test stock availability checks"
      - "Test mobile navigation"
    
    after_phase_3:
      - "Test product review submission"
      - "Test wishlist add/remove"
      - "Test product image gallery"
      - "Test order tracking display"
      - "Test email notifications sent"
      - "Test recently viewed products"
      - "Test product recommendations"
      - "Test password reset flow"
    
    after_phase_4:
      - "Test coupon code validation"
      - "Test save for later"
      - "Test search autocomplete"
      - "Test admin analytics dashboard"
      - "Test admin user management"
      - "Test admin coupon management"
      - "Test Razorpay payment flow"
      - "Test product comparison"
    
    after_phase_5:
      - "Test API rate limiting"
      - "Test performance (load time < 3s)"
      - "Test SEO meta tags"
      - "Test accessibility with screen reader"
      - "Test PWA installation"
      - "Test error boundaries"
      - "Test dark mode toggle"
      - "Run full test suite"
      - "Load testing (concurrent users)"

known_limitations:
  - "Cart quantity cannot be edited manually (only add more of same item)"
  - "Shipping address from registration cannot be changed during checkout"
  - "Stock levels don't decrease after purchase"
  - "No email notifications for orders"
  - "No password reset functionality"
  - "Product images use Unsplash URLs (may have rate limits)"
  - "No support for product variants (size/color options)"

database_collections:
  - name: "users"
    fields: "id, name, email, password (hashed), phone, address, role, created_at"
  - name: "products"
    fields: "id, name, brand, price, description, category, frame_type, frame_shape, color, image_url, stock, created_at"
  - name: "cart"
    fields: "id, user_id, product_id, quantity, added_at"
  - name: "orders"
    fields: "id, user_id, items[], total_amount, payment_status, order_status, shipping_address, created_at"
  - name: "payment_transactions"
    fields: "id, session_id, user_id, order_id, amount, currency, payment_status, status, metadata, created_at, updated_at"