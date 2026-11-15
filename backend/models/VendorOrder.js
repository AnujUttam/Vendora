const mongoose = require("mongoose");

const vendorOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: "" },
  sku: { type: String, default: "" },
  status: {
    type: String,
    enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
    default: "placed"
  }
});

const vendorOrderSchema = new mongoose.Schema(
  {
    parentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    parentOrderNumber: {
      type: String,
      required: true
    },
    vendorOrderNumber: {
      type: String,
      required: true,
      unique: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [vendorOrderItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    commissionRate: {
      type: Number,
      default: 10
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    vendorPayout: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
      default: "placed",
      index: true
    },
    shippingAddress: {
      fullName: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    trackingHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: "" },
        updatedBy: { type: String, default: "Vendor" },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

vendorOrderSchema.index({ vendorId: 1, createdAt: -1 });

const VendorOrder = mongoose.model("VendorOrder", vendorOrderSchema);

module.exports = VendorOrder;
