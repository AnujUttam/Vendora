const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: {
      type: String,
      required: [true, "Store description is required"],
      trim: true,
      maxlength: 1000
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },
    address: {
      type: String,
      required: [true, "Store address is required"],
      trim: true
    },
    logo: {
      type: String,
      default: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=400"
    },
    banner: {
      type: String,
      default: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending"
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% platform commission by default
      min: 0,
      max: 100
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    reviewedAt: {
      type: Date
    },
    bankDetails: {
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);

vendorSchema.index({ status: 1 });

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
