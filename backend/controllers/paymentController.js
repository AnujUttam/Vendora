const Payment = require("../models/Payment");
const Order = require("../models/Order");
const VendorOrder = require("../models/VendorOrder");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyRazorpayWebhook,
  razorpayKeyId
} = require("../services/paymentService");

// Create payment gateway order
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized for this order" });
    }

    const gatewayData = await createRazorpayOrder(order.totalAmount, order.orderNumber);

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        razorpayOrderId: gatewayData.orderId,
        gatewayResponse: gatewayData,
        paymentStatus: "pending"
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      gatewayData,
      keyId: razorpayKeyId
    });
  } catch (error) {
    console.error("Create Payment Order Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to create payment order" });
  }
};

// Verify payment signature
const verifyPaymentTransaction = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        { paymentStatus: "failed", errorReason: "Signature verification failed" }
      );
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    order.paymentStatus = "paid";
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
      razorpaySignature,
      paidAt: new Date()
    };
    await order.save();

    await VendorOrder.updateMany({ parentOrderId: order._id }, { paymentStatus: "paid" });

    const paymentRecord = await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        paymentStatus: "paid",
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
        razorpaySignature,
        paidAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment successfully verified and logged",
      payment: paymentRecord,
      order
    });
  } catch (error) {
    console.error("Payment Verification Error:", error.message);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

// Razorpay Webhook Handler
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    // Verify webhook signature
    const isValid = verifyRazorpayWebhook(req.body, signature);

    if (!isValid) {
      console.warn("Razorpay Webhook: Invalid signature received");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Razorpay Webhook: Event received -> ${event}`);

    if (event === "payment.captured") {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Update payment record
      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId },
        {
          paymentStatus: "paid",
          razorpayPaymentId,
          paidAt: new Date()
        }
      );

      if (payment) {
        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: "paid",
          "paymentDetails.paidAt": new Date()
        });
        await VendorOrder.updateMany({ parentOrderId: payment.orderId }, { paymentStatus: "paid" });
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { paymentStatus: "failed", errorReason: paymentEntity.error_description || "Payment failed at gateway" }
      );
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error.message);
    res.status(500).json({ success: false, message: "Webhook handling failed" });
  }
};

// Customer Payment Ledger
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.user._id })
      .populate("orderId", "orderNumber totalAmount orderStatus")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load payments" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentTransaction,
  handleRazorpayWebhook,
  getMyPayments
};
