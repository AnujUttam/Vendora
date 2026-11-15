const express = require("express");
const router = express.Router();

const {
  checkoutOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  downloadInvoice,
  getVendorOrders,
  updateOrderStatus
} = require("../controllers/orderController");

const { protect, approvedVendor } = require("../middleware/authMiddleware");

// Customer routes
router.post("/checkout", protect, checkoutOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.get("/:id/invoice", protect, downloadInvoice);
router.put("/:id/cancel", protect, cancelOrder);

// Vendor order management routes
router.get("/vendor/orders", protect, approvedVendor, getVendorOrders);
router.put("/:id/status", protect, updateOrderStatus);

module.exports = router;
