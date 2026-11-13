# Vendora - RESTful API Reference Manual

Base URL: `http://localhost:5000/api`  
Authentication: HTTP Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Authentication & User Profile (`/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Rahul Roy",
  "email": "customer@vendora.com",
  "password": "Vendora@123Password",
  "role": "customer",
  "phone": "+91 99000 11223",
  "address": {
    "street": "42 Palm Avenue",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560034"
  }
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "name": "...", "email": "...", "role": "customer" }
}
```

### 1.2 Login User
- **Method**: `POST`
- **Path**: `/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@vendora.com",
  "password": "Vendora@123Password"
}
```
- **Response `200 OK`**: Returns JWT `token` and `user` object.

### 1.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Access**: Protected (Bearer Token)
- **Response `200 OK`**: Current user details.

---

## 2. Vendor Management (`/vendor`)

### 2.1 Apply for Vendor Status
- **Method**: `POST`
- **Path**: `/vendor/apply`
- **Access**: Protected (`customer`)
- **Request Body**:
```json
{
  "storeName": "TechHub Electronics",
  "description": "Distributor of audio & tech gadgets",
  "phone": "+91 98111 22233",
  "address": "Cyber City, Gurugram"
}
```

### 2.2 Check Onboarding Status
- **Method**: `GET`
- **Path**: `/vendor/application-status`
- **Access**: Protected

### 2.3 Vendor Product CRUD
- `POST /vendor/products` - Create product (Approved Vendor only)
- `GET /vendor/products` - List own store listings
- `GET /vendor/products/:id` - Fetch single listing
- `PUT /vendor/products/:id` - Update price, stock, images
- `DELETE /vendor/products/:id` - Soft-delete listing

---

## 3. Marketplace Products Catalog (`/products`)

### 3.1 Browse Products with Dual-Engine Search
- **Method**: `GET`
- **Path**: `/products`
- **Access**: Public
- **Query Parameters**:
  - `search`: Full-text keyword search query (processed by Elasticsearch)
  - `category`: Category filter (`Electronics`, `Fashion`, etc.)
  - `brand`: Brand filter
  - `minPrice`, `maxPrice`: Numeric price boundary
  - `sort`: `newest` | `price_low` | `price_high` | `rating`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)
- **Response `200 OK`**:
```json
{
  "success": true,
  "source": "elasticsearch", // or "mongodb" upon fallback
  "total": 18,
  "page": 1,
  "totalPages": 2,
  "products": [...]
}
```

### 3.2 Get Single Product
- **Method**: `GET`
- **Path**: `/products/:id`
- **Access**: Public

---

## 4. Shopping Cart (`/cart`)

Backed by **Redis in-memory caching** for sub-millisecond updates:
- `GET /cart` - Retrieve current user's cart
- `POST /cart/add` - Add item (`{ productId, quantity }`)
- `PUT /cart/item` - Update quantity (`{ productId, quantity }`)
- `DELETE /cart/item/:productId` - Remove item
- `DELETE /cart/clear` - Empty cart
- `POST /cart/apply-coupon` - Apply promotional code (`{ code: "WELCOME50" }`)
- `DELETE /cart/remove-coupon` - Remove promo code

---

## 5. Orders & Payments (`/orders`)

### 5.1 Checkout Order
- **Method**: `POST`
- **Path**: `/orders/checkout`
- **Access**: Protected
- **Request Body**:
```json
{
  "shippingAddress": {
    "fullName": "Rahul Roy",
    "street": "42 Palm Avenue",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560034",
    "phone": "+91 99000 11223"
  },
  "paymentMethod": "razorpay"
}
```
- **Response `201 Created`**: Returns initialized `order` with multi-vendor split commission calculations and `paymentGatewayData` for Razorpay test checkout.

### 5.2 Verify Razorpay Payment
- **Method**: `POST`
- **Path**: `/orders/verify-payment`
- **Request Body**:
```json
{
  "orderId": "65...",
  "razorpayOrderId": "order_...",
  "razorpayPaymentId": "pay_...",
  "razorpaySignature": "test_signature"
}
```

### 5.3 Order Lifecycle & Invoices
- `GET /orders/my-orders` - Customer order tracking & history
- `GET /orders/:id` - Detailed order view
- `GET /orders/:id/invoice` - Streams generated PDF Tax Invoice (`pdfkit`)
- `GET /orders/vendor/orders` - Vendor view of assigned items and earnings
- `PUT /orders/:id/status` - Lifecycle transition (`placed` -> `packed` -> `shipped` -> `delivered`)

---

## 6. Reviews & Ratings (`/reviews`)
- `GET /reviews/product/:productId` - Public reviews list
- `POST /reviews` - Customer review (`{ productId, rating, title, comment }`)

---

## 7. Coupons (`/coupons`)
- `POST /coupons/validate` - Check code validity
- `GET /coupons` - Admin: List all coupons
- `POST /coupons` - Admin: Publish coupon (`{ code, discountPercent, maxDiscount, minOrderValue, expiryDate }`)
- `DELETE /coupons/:id` - Admin: Remove coupon

---

## 8. S3 & Media Upload (`/upload`)
- **Method**: `POST`
- **Path**: `/upload`
- **Access**: Protected (`approvedVendor`)
- **Body**: `multipart/form-data` with field `image`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "url": "https://bucket.s3.amazonaws.com/products/...",
  "provider": "s3"
}
```

---

## 9. Platform Governance & Analytics (`/admin`)
- `GET /admin/analytics` - Platform GMV, Commission, Vendor Payouts, Order Status
- `GET /admin/applications` - List vendor onboarding requests
- `PUT /admin/applications/:id/approve` - Approve merchant with commission %
- `PUT /admin/applications/:id/reject` - Reject merchant with reason
- `GET /admin/orders` - Complete marketplace order feed
- `GET /admin/users` - User directory
