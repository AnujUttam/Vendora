const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },
  commissionRate: { type: Number, default: 10 },
  commissionAmount: { type: Number, default: 0 },
  vendorPayout: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
    default: "placed"
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India" },
      phone: { type: String, required: true }
    },
    totalItemsPrice: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    couponCode: {
      type: String,
      default: null
    },
    shippingPrice: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    platformCommissionTotal: {
      type: Number,
      default: 0
    },
    vendorPayouts: [
      {
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor"
        },
        storeName: String,
        amount: Number,
        commission: Number
      }
    ],
    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe", "cod", "mock"],
      default: "razorpay"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      stripePaymentIntentId: String,
      paidAt: Date
    },
    orderStatus: {
      type: String,
      enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
      default: "placed",
      index: true
    },
    trackingHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: "" },
        updatedBy: { type: String, default: "system" },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
