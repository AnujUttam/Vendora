const express = require("express");
const router = express.Router();

// Vendor controller
const {
  applyVendor,
  getVendorProfile,
  updateVendorProfile,
  getApplicationStatus,
  getPublicVendorStore,
  getVendorDashboardStats
} = require("../controllers/vendorController");

// Product controller
const {
  createProduct,
  getVendorProducts,
  getVendorProductById,
  updateProduct,
  deleteProduct,
  updateProductStock
} = require("../controllers/productController");

// Authentication middleware
const {
  protect,
  approvedVendor
} = require("../middleware/authMiddleware");

// ========================================
// PUBLIC VENDOR STOREFRONT
// ========================================
router.get("/store/:vendorId", getPublicVendorStore);

// ========================================
// VENDOR APPLICATION
// ========================================
router.post("/apply", protect, applyVendor);
router.get("/application-status", protect, getApplicationStatus);

// ========================================
// APPROVED VENDOR PROFILE & SETTINGS
// ========================================
router.get("/profile", protect, approvedVendor, getVendorProfile);
router.put("/profile", protect, approvedVendor, updateVendorProfile);
router.get("/dashboard/stats", protect, approvedVendor, getVendorDashboardStats);

// ========================================
// VENDOR PRODUCT MANAGEMENT
// ========================================
router.post("/products", protect, approvedVendor, createProduct);
router.get("/products", protect, approvedVendor, getVendorProducts);
router.get("/products/:id", protect, approvedVendor, getVendorProductById);
router.put("/products/:id", protect, approvedVendor, updateProduct);
router.delete("/products/:id", protect, approvedVendor, deleteProduct);
router.put("/products/:id/stock", protect, approvedVendor, updateProductStock);

module.exports = router;
