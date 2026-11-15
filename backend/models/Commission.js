const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    vendorOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorOrder"
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true
    },
    orderTotal: {
      type: Number,
      required: true
    },
    commissionRate: {
      type: Number,
      required: true
    },
    commissionAmount: {
      type: Number,
      required: true
    },
    vendorPayout: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "settled", "refunded"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

commissionSchema.index({ vendorId: 1, createdAt: -1 });

const Commission = mongoose.model("Commission", commissionSchema);

module.exports = Commission;
