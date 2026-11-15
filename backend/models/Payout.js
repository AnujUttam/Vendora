const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true
    },
    transactionReference: {
      type: String,
      default: ""
    },
    bankDetailsSnapshot: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String
    },
    periodStart: Date,
    periodEnd: Date,
    processedAt: Date,
    note: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

payoutSchema.index({ vendorId: 1, createdAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);

module.exports = Payout;
