const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: 2000
    },
    verifiedPurchase: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate review per user for same product if desirable, or allow multiple
reviewSchema.index({ userId: 1, productId: 1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
