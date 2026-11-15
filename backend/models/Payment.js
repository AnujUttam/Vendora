const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "mock"],
      default: "razorpay"
    },
    paymentStatus: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "refunded"],
      default: "created",
      index: true
    },
    razorpayOrderId: {
      type: String,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      index: true
    },
    razorpaySignature: {
      type: String
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed
    },
    errorReason: {
      type: String,
      default: ""
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
