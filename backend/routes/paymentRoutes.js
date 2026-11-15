const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPaymentTransaction,
  handleRazorpayWebhook,
  getMyPayments
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

// Webhook endpoint (Public, verified via x-razorpay-signature header)
router.post("/webhook", handleRazorpayWebhook);

// Protected customer payment routes
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPaymentTransaction);
router.get("/my-payments", protect, getMyPayments);

module.exports = router;
