
const express = require("express");

const router = express.Router();

// Vendor controller
const {
  applyVendor,
  getVendorProfile,
  getApplicationStatus
} = require("../controllers/vendorController");

// Product controller
const {
  createProduct,
  getVendorProducts,
  getVendorProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

// Authentication middleware
const {
  protect,
  approvedVendor
} = require("../middleware/authMiddleware");


// ========================================
// VENDOR APPLICATION
// ========================================

// Apply to become a vendor
router.post("/apply", protect, applyVendor);

// Check application status
router.get(
  "/application-status",
  protect,
  getApplicationStatus
);


// ========================================
// APPROVED VENDOR PROFILE
// ========================================

router.get(
  "/profile",
  protect,
  approvedVendor,
  getVendorProfile
);


// ========================================
// VENDOR PRODUCT MANAGEMENT
// ========================================

// Create product
router.post(
  "/products",
  protect,
  approvedVendor,
  createProduct
);

// Get all own products
router.get(
  "/products",
  protect,
  approvedVendor,
  getVendorProducts
);

// Get single own product
router.get(
  "/products/:id",
  protect,
  approvedVendor,
  getVendorProductById
);

// Update own product
router.put(
  "/products/:id",
  protect,
  approvedVendor,
  updateProduct
);

// Delete own product
router.delete(
  "/products/:id",
  protect,
  approvedVendor,
  deleteProduct
);


module.exports = router;
