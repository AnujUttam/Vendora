const express = require("express");
const router = express.Router();

const {
  getVendorApplications,
  approveVendor,
  rejectVendor,
  toggleVendorStatus,
  getPlatformAnalytics,
  getAllUsers,
  toggleUserStatus,
  getAllProductsAdmin,
  toggleProductStatus,
  deleteProductAdmin,
  getAllOrders,
  getCommissionLedger
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All routes here require admin privileges
router.use(protect, authorize("admin"));

// Analytics
router.get("/analytics", getPlatformAnalytics);

// Vendor Applications & Management
router.get("/applications", getVendorApplications);
router.put("/applications/:id/approve", approveVendor);
router.put("/applications/:id/reject", rejectVendor);
router.put("/vendors/:id/toggle-status", toggleVendorStatus);

// Users Management
router.get("/users", getAllUsers);
router.put("/users/:id/toggle-status", toggleUserStatus);

// Product Moderation
router.get("/products", getAllProductsAdmin);
router.put("/products/:id/toggle-status", toggleProductStatus);
router.delete("/products/:id", deleteProductAdmin);

// Orders Management
router.get("/orders", getAllOrders);

// Commission & Payout Ledger
router.get("/commissions", getCommissionLedger);

module.exports = router;
