"# 📋 Reorganized Development Phases (4-5 Credits Each)

## 🎯 Goal
Break down development into small, manageable phases that can be completed in 4-5 credits (approximately 30-45 minutes of work each).

---

## 🔵 PHASE 1A: User Authentication Setup (4 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 30-40 minutes

### Backend Tasks:
- [x] User Registration API with bcrypt password hashing
- [x] User & Admin Login API (fixed admin credentials)
- [x] JWT token generation and verification
- [x] Authentication middleware

### Frontend Tasks:
- [x] Login page with form validation
- [x] Register page with form validation
- [x] Token storage (localStorage)
- [x] Protected route wrapper

### Testing:
- [x] Test registration with duplicate email
- [x] Test login with correct/incorrect credentials
- [x] Test admin login
- [x] Test protected route access

---

## 🔵 PHASE 1B: Product Catalog Foundation (4 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 30-40 minutes

### Backend Tasks:
- [x] Product model with all fields
- [x] GET /api/products (list all)
- [x] GET /api/products/{id} (single product)
- [x] Database seeding script (10 products)

### Frontend Tasks:
- [x] Products listing page with grid layout
- [x] Product cards with image, name, price
- [x] Product detail page
- [x] Routing setup for products

### Testing:
- [x] Test product listing loads
- [x] Test product detail navigation
- [x] Test product data displays correctly

---

## 🔵 PHASE 1C: Admin Product Management (5 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [x] POST /api/products (create - admin only)
- [x] PUT /api/products/{id} (update - admin only)
- [x] DELETE /api/products/{id} (delete - admin only)
- [x] Admin role verification middleware

### Frontend Tasks:
- [x] Admin dashboard page
- [x] Product management table
- [x] Add product form/dialog
- [x] Edit product functionality
- [x] Delete product with confirmation

### Testing:
- [x] Test create product (admin only)
- [x] Test edit product
- [x] Test delete product
- [x] Test non-admin cannot access

---

## 🔵 PHASE 1D: Shopping Cart (4 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [x] GET /api/cart (with product details JOIN)
- [x] POST /api/cart (add item)
- [x] DELETE /api/cart/{product_id} (remove item)
- [x] DELETE /api/cart (clear cart)

### Frontend Tasks:
- [x] Cart page with items list
- [x] Add to cart button on product pages
- [x] Remove from cart button
- [x] Cart count badge in navigation

### Testing:
- [x] Test add to cart
- [x] Test remove from cart
- [x] Test cart count updates
- [x] Test empty cart state

---

## 🔵 PHASE 1E: Stripe Payment Integration (5 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 40-50 minutes

### Backend Tasks:
- [x] POST /api/payment/checkout (create Stripe session)
- [x] GET /api/payment/status/{session_id} (poll status)
- [x] POST /api/webhook/stripe (handle webhook)
- [x] Payment transactions table/collection

### Frontend Tasks:
- [x] Checkout button in cart
- [x] Redirect to Stripe checkout
- [x] Payment success page with status polling
- [x] Handle payment failure

### Testing:
- [x] Test Stripe session creation
- [x] Test payment with test card (4242...)
- [x] Test payment failure scenario
- [x] Test webhook handling

---

## 🔵 PHASE 1F: Order Management (4 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [x] POST /api/orders (create order after payment)
- [x] GET /api/orders (list user's orders)
- [x] GET /api/orders/{id} (single order)
- [x] Order creation on payment success

### Frontend Tasks:
- [x] Orders page with order history
- [x] Order status badges
- [x] Shipping address display
- [x] Empty orders state

### Testing:
- [x] Test order created after payment
- [x] Test cart cleared after order
- [x] Test orders list displays
- [x] Test admin sees all orders

---

## 🔵 PHASE 1G: UI Polish & Landing Page (3 Credits)
**Status:** ✅ COMPLETED  
**Estimated Time:** 25-30 minutes

### Frontend Tasks:
- [x] Landing page with hero section
- [x] Features showcase
- [x] Call-to-action sections
- [x] Gradient theme implementation
- [x] Glassmorphism effects
- [x] Responsive design

### Testing:
- [x] Test on mobile viewport
- [x] Test navigation between pages
- [x] Test visual consistency

---

## 🟢 PHASE 2A: Product Search & Filters (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Add search query parameter to GET /api/products
- [ ] Add category filter
- [ ] Add price range filter
- [ ] Add sorting (price, name)

### Frontend Tasks:
- [ ] Search bar with live filtering
- [ ] Category filter buttons
- [ ] Price range slider
- [ ] Sort dropdown
- [ ] Clear filters button

### Testing:
- [ ] Test search by product name
- [ ] Test filter by category
- [ ] Test price range filter
- [ ] Test sorting

---

## 🟢 PHASE 2B: User Profile Management (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] GET /api/user/profile
- [ ] PUT /api/user/profile
- [ ] PUT /api/user/password

### Frontend Tasks:
- [ ] Profile page
- [ ] Edit profile form
- [ ] Change password form
- [ ] Profile link in navigation

### Testing:
- [ ] Test profile display
- [ ] Test profile update
- [ ] Test password change

---

## 🟢 PHASE 2C: Address Management (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] Create addresses table
- [ ] GET /api/user/addresses
- [ ] POST /api/user/addresses
- [ ] PUT /api/user/addresses/{id}
- [ ] DELETE /api/user/addresses/{id}

### Frontend Tasks:
- [ ] Addresses page
- [ ] Add address form
- [ ] Edit address
- [ ] Delete address
- [ ] Set default address

### Testing:
- [ ] Test CRUD operations
- [ ] Test default address
- [ ] Test address in checkout

---

## 🟢 PHASE 2D: Cart Quantity Management (3 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 25-30 minutes

### Backend Tasks:
- [ ] PATCH /api/cart/{item_id} (update quantity)
- [ ] Stock validation

### Frontend Tasks:
- [ ] Quantity +/- buttons in cart
- [ ] Direct quantity input
- [ ] Real-time total update
- [ ] Stock limit handling

### Testing:
- [ ] Test increase quantity
- [ ] Test decrease quantity
- [ ] Test stock limit

---

## 🟢 PHASE 2E: Stock Management (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Reduce stock on order creation
- [ ] Check stock before add to cart
- [ ] Return stock on order cancellation
- [ ] Low stock alerts

### Frontend Tasks:
- [ ] Stock indicators on product cards
- [ ] \"Only X left\" badges
- [ ] Out of stock state
- [ ] Disable add to cart if out of stock

### Testing:
- [ ] Test stock reduces after order
- [ ] Test cannot add if out of stock
- [ ] Test low stock indicators

---

## 🟡 PHASE 3A: Product Reviews (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] Create reviews table
- [ ] GET /api/products/{id}/reviews
- [ ] POST /api/products/{id}/reviews
- [ ] PUT /api/reviews/{id}
- [ ] DELETE /api/reviews/{id}

### Frontend Tasks:
- [ ] Reviews section on product detail
- [ ] Star rating display
- [ ] Write review form
- [ ] Edit/delete own reviews

### Testing:
- [ ] Test submit review
- [ ] Test edit review
- [ ] Test delete review

---

## 🟡 PHASE 3B: Wishlist (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Create wishlist table
- [ ] GET /api/wishlist
- [ ] POST /api/wishlist
- [ ] DELETE /api/wishlist/{product_id}

### Frontend Tasks:
- [ ] Wishlist page
- [ ] Heart icon on products
- [ ] Move to cart button
- [ ] Wishlist count badge

### Testing:
- [ ] Test add to wishlist
- [ ] Test remove from wishlist
- [ ] Test move to cart

---

## 🟡 PHASE 3C: Product Image Gallery (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Create product_images table
- [ ] GET /api/products/{id}/images
- [ ] POST /api/products/{id}/images (admin)
- [ ] DELETE /api/products/{id}/images/{image_id} (admin)

### Frontend Tasks:
- [ ] Image carousel on product detail
- [ ] Thumbnail gallery
- [ ] Image zoom on hover
- [ ] Admin: Upload multiple images

### Testing:
- [ ] Test image carousel
- [ ] Test thumbnail clicks
- [ ] Test admin upload

---

## 🟡 PHASE 3D: Order Tracking (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Create order_tracking table
- [ ] GET /api/orders/{id}/tracking
- [ ] PUT /api/orders/{id}/status (admin)
- [ ] Add tracking_number to orders

### Frontend Tasks:
- [ ] Order tracking page
- [ ] Status timeline
- [ ] Tracking number display
- [ ] Estimated delivery date

### Testing:
- [ ] Test status updates
- [ ] Test tracking display
- [ ] Test timeline visualization

---

## 🟡 PHASE 3E: Email Notifications (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] Set up email service (SendGrid/SES)
- [ ] Welcome email on registration
- [ ] Order confirmation email
- [ ] Payment receipt email
- [ ] Shipping notification email

### Frontend Tasks:
- [ ] Email preferences in profile
- [ ] Opt-in/opt-out toggles

### Testing:
- [ ] Test welcome email
- [ ] Test order confirmation
- [ ] Test all email triggers

---

## 🟡 PHASE 3F: Recently Viewed & Recommendations (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Create recently_viewed table
- [ ] GET /api/user/recently-viewed
- [ ] POST /api/user/recently-viewed/{product_id}
- [ ] GET /api/products/recommended
- [ ] GET /api/products/{id}/related

### Frontend Tasks:
- [ ] Recently viewed section (home, product detail)
- [ ] Recommended products carousel
- [ ] Related products on detail page

### Testing:
- [ ] Test tracking views
- [ ] Test recommendations display
- [ ] Test related products

---

## 🟠 PHASE 4A: Coupon System (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] Create coupons table
- [ ] POST /api/coupons/validate
- [ ] POST /api/orders/apply-coupon
- [ ] GET/POST/PUT/DELETE /api/admin/coupons

### Frontend Tasks:
- [ ] Coupon input in cart
- [ ] Apply coupon button
- [ ] Discount display
- [ ] Admin coupon management

### Testing:
- [ ] Test valid coupon
- [ ] Test invalid coupon
- [ ] Test discount calculation

---

## 🟠 PHASE 4B: Save for Later (3 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 25-30 minutes

### Backend Tasks:
- [ ] Create saved_items table
- [ ] GET /api/saved-items
- [ ] POST /api/cart/{item_id}/save
- [ ] POST /api/saved-items/{id}/move-to-cart

### Frontend Tasks:
- [ ] Save for later button in cart
- [ ] Saved items section
- [ ] Move to cart button

### Testing:
- [ ] Test save item
- [ ] Test move to cart
- [ ] Test delete saved item

---

## 🟠 PHASE 4C: Search Autocomplete (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] GET /api/search/suggestions?q=query
- [ ] Product name matching
- [ ] Brand matching
- [ ] Category suggestions

### Frontend Tasks:
- [ ] Search dropdown with suggestions
- [ ] Product suggestions with images
- [ ] Keyboard navigation
- [ ] Recent searches

### Testing:
- [ ] Test suggestions appear
- [ ] Test keyboard navigation
- [ ] Test click to search

---

## 🟠 PHASE 4D: Admin Sales Analytics (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] GET /api/admin/analytics/sales
- [ ] GET /api/admin/analytics/top-products
- [ ] GET /api/admin/analytics/revenue
- [ ] Date range filtering

### Frontend Tasks:
- [ ] Analytics page with charts
- [ ] Sales chart (Chart.js/Recharts)
- [ ] Revenue breakdown
- [ ] Top products table
- [ ] Date range picker

### Testing:
- [ ] Test data displays
- [ ] Test date filtering
- [ ] Test charts render

---

## 🟠 PHASE 4E: Admin Inventory Management (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] GET /api/admin/inventory/alerts
- [ ] PUT /api/admin/inventory/threshold
- [ ] Low stock email alerts

### Frontend Tasks:
- [ ] Inventory page
- [ ] Low stock alerts
- [ ] Bulk stock update
- [ ] Stock history log

### Testing:
- [ ] Test low stock alerts
- [ ] Test bulk update
- [ ] Test threshold settings

---

## 🟠 PHASE 4F: Admin User Management (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] GET /api/admin/users
- [ ] GET /api/admin/users/{id}
- [ ] PUT /api/admin/users/{id}
- [ ] PUT /api/admin/users/{id}/block

### Frontend Tasks:
- [ ] Users management page
- [ ] Users table with search
- [ ] View user details
- [ ] Block/unblock user
- [ ] View user orders

### Testing:
- [ ] Test user list
- [ ] Test user details
- [ ] Test block user

---

## 🟠 PHASE 4G: Razorpay Payment (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] POST /api/payment/razorpay/checkout
- [ ] POST /api/payment/razorpay/verify
- [ ] POST /api/webhook/razorpay

### Frontend Tasks:
- [ ] Payment method selection
- [ ] Razorpay checkout modal
- [ ] Payment verification

### Testing:
- [ ] Test Razorpay payment
- [ ] Test verification
- [ ] Test webhook

---

## 🟠 PHASE 4H: Product Comparison (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] No new APIs needed (use existing GET)

### Frontend Tasks:
- [ ] Add to compare checkbox
- [ ] Compare bar (floating)
- [ ] Comparison page
- [ ] Side-by-side specs
- [ ] Highlight differences

### Testing:
- [ ] Test add to compare
- [ ] Test comparison page
- [ ] Test differences highlight

---

## 🔴 PHASE 5A: Performance Optimization (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Backend Tasks:
- [ ] Database indexing optimization
- [ ] Query optimization
- [ ] API response caching (Redis)

### Frontend Tasks:
- [ ] Code splitting by route
- [ ] Lazy loading images
- [ ] React.memo for heavy components
- [ ] Debounce search input
- [ ] Optimize bundle size

### Testing:
- [ ] Load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Bundle size analysis

---

## 🔴 PHASE 5B: SEO & Accessibility (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Frontend Tasks:
- [ ] React Helmet for meta tags
- [ ] Dynamic page titles
- [ ] Open Graph tags
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Alt text for images
- [ ] Color contrast fixes

### Testing:
- [ ] SEO audit (Lighthouse)
- [ ] Accessibility audit (axe)
- [ ] Screen reader test

---

## 🔴 PHASE 5C: PWA & Offline Support (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Frontend Tasks:
- [ ] Service worker
- [ ] Web app manifest
- [ ] Install prompt
- [ ] Offline fallback
- [ ] Cache static assets

### Testing:
- [ ] Test offline mode
- [ ] Test install prompt
- [ ] Test cached assets

---

## 🔴 PHASE 5D: Error Handling & Logging (4 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 35-40 minutes

### Backend Tasks:
- [ ] Structured logging (JSON)
- [ ] Error tracking (Sentry)
- [ ] API rate limiting
- [ ] Request validation

### Frontend Tasks:
- [ ] Error boundary components
- [ ] Fallback UI
- [ ] Toast notifications enhancement
- [ ] Loading skeletons

### Testing:
- [ ] Test error boundaries
- [ ] Test rate limiting
- [ ] Test validation errors

---

## 🔴 PHASE 5E: Dark Mode (3 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 25-30 minutes

### Frontend Tasks:
- [ ] Dark theme color scheme
- [ ] Theme toggle
- [ ] Persist preference (localStorage)
- [ ] System preference detection

### Testing:
- [ ] Test theme toggle
- [ ] Test persistence
- [ ] Test system preference

---

## 🔴 PHASE 5F: Internationalization (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Frontend Tasks:
- [ ] Set up react-i18next
- [ ] Translation files (en, es, fr)
- [ ] Language selector
- [ ] Currency formatting
- [ ] Date/time formatting

### Testing:
- [ ] Test language switch
- [ ] Test translations
- [ ] Test formatting

---

## 🔴 PHASE 5G: Analytics Integration (3 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 25-30 minutes

### Frontend Tasks:
- [ ] Google Analytics 4
- [ ] Page view tracking
- [ ] E-commerce event tracking
- [ ] Conversion funnel
- [ ] Custom events

### Testing:
- [ ] Test events fire
- [ ] Test GA4 dashboard

---

## 🔴 PHASE 5H: Comprehensive Testing (5 Credits)
**Status:** ❌ TODO  
**Estimated Time:** 40-45 minutes

### Testing Tasks:
- [ ] Unit tests (Jest)
- [ ] Component tests (React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] API tests
- [ ] Test coverage > 80%
- [ ] Load testing

---

## 📊 Phase Summary

| Phase Group | Total Phases | Total Credits | Status |
|-------------|--------------|---------------|--------|
| Phase 1 (MVP) | 7 | 29 | ✅ COMPLETED |
| Phase 2 (UX) | 5 | 20 | ❌ TODO |
| Phase 3 (Engagement) | 6 | 26 | ❌ TODO |
| Phase 4 (Advanced) | 8 | 34 | ❌ TODO |
| Phase 5 (Polish) | 8 | 33 | ❌ TODO |
| **TOTAL** | **34** | **142** | **7/34 Done** |

---

## 🎯 Current Progress: 20.6% Complete (29/142 credits)

---

**Last Updated:** 2025-11-12  
**Version:** 2.0  
**Organization:** Optimized for 4-5 credits per phase
"