const express = require("express");
const router = express.Router();

const {
  getVendorApplications,
  approveVendor,
  rejectVendor,
  getPlatformAnalytics,
  getAllUsers,
  toggleUserStatus,
  getAllOrders
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All routes here require admin privileges
router.use(protect, authorize("admin"));

// Analytics
router.get("/analytics", getPlatformAnalytics);

// Vendor Applications
router.get("/applications", getVendorApplications);
router.put("/applications/:id/approve", approveVendor);
router.put("/applications/:id/reject", rejectVendor);

// Users Management
router.get("/users", getAllUsers);
router.put("/users/:id/toggle-status", toggleUserStatus);

// Orders Management
router.get("/orders", getAllOrders);

module.exports = router;
