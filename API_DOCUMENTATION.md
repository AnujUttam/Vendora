# Vendora Multi-Vendor E-Commerce Marketplace – REST API Documentation

**Base URL**: `http://localhost:5000/api`  
**Protocol**: HTTP/1.1  
**Data Format**: JSON (`Content-Type: application/json`)  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## Table of Contents
1. [Authentication & User Management (`/api/auth`)](#1-authentication--user-management)
2. [Address Book Management (`/api/auth/addresses`)](#2-address-book-management)
3. [Vendor Management & Storefront (`/api/vendor`)](#3-vendor-management--storefront)
4. [Product Catalog & Search (`/api/products`)](#4-product-catalog--search)
5. [Categories Management (`/api/categories`)](#5-categories-management)
6. [Shopping Cart (`/api/cart`)](#6-shopping-cart)
7. [Wishlist (`/api/wishlist`)](#7-wishlist)
8. [Orders & Multi-Vendor Fulfillment (`/api/orders`)](#8-orders--multi-vendor-fulfillment)
9. [Payment Processing & Razorpay Webhooks (`/api/payments`)](#9-payment-processing--razorpay-webhooks)
10. [Admin Marketplace Administration (`/api/admin`)](#10-admin-marketplace-administration)
11. [Product Reviews (`/api/reviews`)](#11-product-reviews)
12. [In-App Notifications (`/api/notifications`)](#12-in-app-notifications)
13. [Media & Asset Uploads (`/api/upload`)](#13-media--asset-uploads)
14. [System Health & Fallback Telemetry (`/api/health`)](#14-system-health--fallback-telemetry)

---

## 1. Authentication & User Management

### 1.1 Register Customer or Vendor
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "customer" // "customer" or "vendor"
}
```
- **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "650000000000000000000001",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer"
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "650000000000000000000001",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer",
    "isApproved": true
  }
}
```

### 1.3 Get Current Authenticated Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (`200 OK`): Returns current user object.

### 1.4 Update User Profile
- **Method**: `PUT`
- **Path**: `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "phone": "+1-555-0199",
  "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
}
```

---

## 2. Address Book Management

### 2.1 Get Saved Addresses
- **Method**: `GET`
- **Path**: `/api/auth/addresses`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "addresses": [
    {
      "_id": "650000000000000000000005",
      "fullName": "Jane Doe",
      "phone": "+1-555-0199",
      "street": "123 Market St, Suite 400",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "United States",
      "isDefault": true,
      "type": "home"
    }
  ]
}
```

### 2.2 Add Delivery Address
- **Method**: `POST`
- **Path**: `/api/auth/addresses`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "phone": "+1-555-0199",
  "street": "456 Mission Blvd",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94103",
  "country": "United States",
  "isDefault": false,
  "type": "office"
}
```

### 2.3 Set Address as Default
- **Method**: `PUT`
- **Path**: `/api/auth/addresses/:id/default`
- **Headers**: `Authorization: Bearer <token>`

### 2.4 Delete Address
- **Method**: `DELETE`
- **Path**: `/api/auth/addresses/:id`
- **Headers**: `Authorization: Bearer <token>`

---

## 3. Vendor Management & Storefront

### 3.1 Apply for Vendor Account
- **Method**: `POST`
- **Path**: `/api/vendor/apply`
- **Headers**: `Authorization: Bearer <token>` (Customer/Vendor role)
- **Request Body**:
```json
{
  "storeName": "ElectroTech World",
  "description": "Premium audio gear and smart electronics accessories.",
  "phone": "+1-555-9876",
  "address": "742 Evergreen Terrace, Springfield"
}
```

### 3.2 Get Vendor Application Status
- **Method**: `GET`
- **Path**: `/api/vendor/status`
- **Headers**: `Authorization: Bearer <token>`

### 3.3 Get / Update Vendor Store Settings
- **Method**: `GET` / `PUT`
- **Path**: `/api/vendor/profile`
- **Headers**: `Authorization: Bearer <token>` (Approved Vendor)
- **Request Body (PUT)**:
```json
{
  "storeName": "ElectroTech Premium",
  "description": "Refined electronics and audio solutions.",
  "phone": "+1-555-9876",
  "address": "742 Evergreen Terrace, Suite 101",
  "logo": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400",
  "banner": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
  "bankDetails": {
    "accountHolderName": "Jane Doe",
    "accountNumber": "987654321012",
    "bankName": "Silicon Valley Bank",
    "routingNumber": "121000358"
  }
}
```

### 3.4 Public Vendor Storefront
- **Method**: `GET`
- **Path**: `/api/vendor/store/:vendorId`
- **Access**: Public
- **Success Response** (`200 OK`): Returns vendor store metadata along with active products.

### 3.5 Vendor Analytics Dashboard Stats
- **Method**: `GET`
- **Path**: `/api/vendor/dashboard/stats`
- **Headers**: `Authorization: Bearer <token>` (Approved Vendor)
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "stats": {
    "totalProducts": 15,
    "activeProducts": 14,
    "lowStockProducts": 2,
    "totalOrders": 38,
    "pendingFulfillment": 4,
    "completedOrders": 32,
    "totalRevenue": 48200,
    "platformCommission": 4820,
    "netEarnings": 43380
  }
}
```

---

## 4. Product Catalog & Search

### 4.1 Browse Products with Filters & Elasticsearch
- **Method**: `GET`
- **Path**: `/api/products`
- **Query Parameters**:
  - `search`: Full text search term (routed to Elasticsearch with MongoDB regex fallback)
  - `category`: Filter by category name
  - `minPrice` / `maxPrice`: Numerical price range
  - `sort`: `price_asc`, `price_desc`, `rating`, `newest`
  - `page`: Page index (default: 1)
  - `limit`: Items per page (default: 12)
- **Success Response** (`200 OK`): Returns paginated products with total count, pages, and active search source.

### 4.2 Get Product Details
- **Method**: `GET`
- **Path**: `/api/products/:id`
- **Access**: Public

### 4.3 Create Product
- **Method**: `POST`
- **Path**: `/api/products`
- **Headers**: `Authorization: Bearer <token>` (Approved Vendor)
- **Request Body**:
```json
{
  "name": "Wireless Noise Cancelling Headphones",
  "description": "Ergonomic over-ear headphones with 40h battery life.",
  "category": "Electronics",
  "brand": "VendoraSound",
  "price": 199.99,
  "stock": 45,
  "sku": "VND-TECH-001",
  "images": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800"
  ]
}
```

### 4.4 Update Product Stock
- **Method**: `PUT`
- **Path**: `/api/products/:id/stock`
- **Headers**: `Authorization: Bearer <token>` (Vendor owner or Admin)
- **Request Body**: `{ "stock": 50 }`

---

## 5. Categories Management

### 5.1 Get All Categories
- **Method**: `GET`
- **Path**: `/api/categories`
- **Access**: Public
- **Success Response** (`200 OK`): Returns array of categories with live aggregated product counts.

### 5.2 Create Category
- **Method**: `POST`
- **Path**: `/api/categories`
- **Headers**: `Authorization: Bearer <token>` (Admin)
- **Request Body**:
```json
{
  "name": "Smart Home",
  "description": "Connected lights, sensors, thermostats, and automation hubs.",
  "image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=600",
  "icon": "Home",
  "displayOrder": 7
}
```

---

## 6. Shopping Cart

### 6.1 Get Customer Cart
- **Method**: `GET`
- **Path**: `/api/cart`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Cart object cached in Redis (with DB persistence fallback) showing multi-vendor line items, subtotal, shipping charge, discount, and grand total.

### 6.2 Add Item to Cart
- **Method**: `POST`
- **Path**: `/api/cart/add`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "productId": "650000000000000000000010", "quantity": 1 }`

### 6.3 Update Quantity
- **Method**: `PUT`
- **Path**: `/api/cart/update`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "productId": "650000000000000000000010", "quantity": 3 }`

### 6.4 Apply Discount Coupon
- **Method**: `POST`
- **Path**: `/api/cart/coupon`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "code": "WELCOME50" }`

---

## 7. Wishlist

### 7.1 View Saved Wishlist
- **Method**: `GET`
- **Path**: `/api/wishlist`
- **Headers**: `Authorization: Bearer <token>`

### 7.2 Toggle Product in Wishlist
- **Method**: `POST`
- **Path**: `/api/wishlist/toggle`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "productId": "650000000000000000000010" }`

---

## 8. Orders & Multi-Vendor Fulfillment

### 8.1 Checkout Cart to Multi-Vendor Order
- **Method**: `POST`
- **Path**: `/api/orders/checkout`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "shippingAddress": {
    "fullName": "Jane Doe",
    "phone": "+1-555-0199",
    "street": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "United States"
  },
  "paymentMethod": "razorpay" // "razorpay" or "cod"
}
```
- **Backend Flow**:
  1. Validates stock for all items across multiple vendors.
  2. Deducts product inventory atomically.
  3. Groups items by vendor and generates a parent Customer `Order`.
  4. Creates isolated `VendorOrder` records for each merchant with dedicated subtotal, commission deduction, and fulfillment state (`placed` -> `packed` -> `shipped` -> `delivered`).
  5. Clears active cart.

### 8.2 Cancel Order
- **Method**: `PUT`
- **Path**: `/api/orders/:id/cancel`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "reason": "Accidental duplicate order" }`
- **Effect**: Re-stocks inventory, marks status as `cancelled`.

### 8.3 Download PDF Invoice
- **Method**: `GET`
- **Path**: `/api/orders/:id/invoice`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `application/pdf` binary stream with vendor breakdowns, taxes, and payment confirmation.

---

## 9. Payment Processing & Razorpay Webhooks

### 9.1 Create Razorpay Order
- **Method**: `POST`
- **Path**: `/api/payments/create-order`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "orderId": "650000000000000000000099" }`
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "razorpayOrderId": "order_test_987654",
  "amount": 19999, // Amount in paise
  "currency": "INR",
  "keyId": "rzp_test_placeholder"
}
```

### 9.2 Verify Payment Signature
- **Method**: `POST`
- **Path**: `/api/payments/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "orderId": "650000000000000000000099",
  "razorpayOrderId": "order_test_987654",
  "razorpayPaymentId": "pay_test_123456",
  "razorpaySignature": "signature_hash_hex"
}
```

### 9.3 Razorpay Webhook Ingestion
- **Method**: `POST`
- **Path**: `/api/payments/webhook`
- **Headers**: `x-razorpay-signature: <hmac_sha256_signature>`
- **Access**: External Webhook Dispatcher
- **Effect**: Validates signature using `RAZORPAY_WEBHOOK_SECRET` and reconciles pending payments asynchronously.

---

## 10. Admin Marketplace Administration

### 10.1 Marketplace Overview & Analytics
- **Method**: `GET`
- **Path**: `/api/admin/analytics`
- **Headers**: `Authorization: Bearer <token>` (Admin)
- **Response**: Complete dashboard metrics: Total Revenue, Platform Commission, Vendor Count, User Count, Product Catalog Size, and Recent Transactions.

### 10.2 Review Vendor Application
- **Method**: `PUT`
- **Path**: `/api/admin/vendors/:id/status`
- **Headers**: `Authorization: Bearer <token>` (Admin)
- **Request Body**:
```json
{
  "status": "approved", // "approved" or "rejected"
  "rejectionReason": "",
  "commissionRate": 10 // Tailored platform commission percentage
}
```

### 10.3 Suspend / Reactivate Vendor
- **Method**: `PUT`
- **Path**: `/api/admin/vendors/:id/suspend`
- **Headers**: `Authorization: Bearer <token>` (Admin)
- **Request Body**: `{ "suspended": true }`

---

## 11. System Health & Fallback Telemetry

### 11.1 Check Health and External Services
- **Method**: `GET`
- **Path**: `/api/health`
- **Access**: Public
- **Success Response** (`200 OK`):
```json
{
  "status": "healthy",
  "timestamp": "2026-11-15T17:54:00.000Z",
  "services": {
    "redis": "Connected or In-Memory Map Fallback",
    "elasticsearch": "Connected or MongoDB Text Search Fallback",
    "storage": "AWS S3 or Local Uploads Fallback",
    "database": "connected"
  }
}
```
