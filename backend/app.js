const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// ========================================
// GLOBAL MIDDLEWARE
// ========================================

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================================
// ROOT & HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Vendora Multi-Vendor Marketplace API",
    version: "2.0.0",
    docs: "/docs/api-documentation.md"
  });
});

app.get("/api/health", (req, res) => {
  const { getIsRedisConnected } = require("./services/redisService");
  const { getIsConnected: getIsESConnected } = require("./services/elasticsearchService");

  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      redis: getIsRedisConnected() ? "connected" : "fallback-memory-cache",
      elasticsearch: getIsESConnected() ? "connected" : "fallback-mongodb-engine",
      storage: process.env.AWS_S3_BUCKET ? "aws-s3" : "local-disk"
    }
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/upload", uploadRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route '${req.originalUrl}' not found`
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack || err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

module.exports = app;
