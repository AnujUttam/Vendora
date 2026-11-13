const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Create or update review
const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user._id;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating (1-5), and comment are required"
      });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if user has purchased this product
    const verifiedOrder = await Order.findOne({
      customer: userId,
      paymentStatus: "paid",
      "items.product": productId
    });

    const isVerifiedPurchase = Boolean(verifiedOrder);

    // Create review
    const review = await Review.create({
      userId,
      userName: req.user.name,
      productId,
      rating: numRating,
      title: title || "",
      comment: comment.trim(),
      verifiedPurchase: isVerifiedPurchase
    });

    // Recalculate product rating & total reviews
    const allReviews = await Review.find({ productId });
    const totalReviews = allReviews.length;
    const averageRating =
      allReviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews;

    product.averageRating = Math.round(averageRating * 10) / 10;
    product.totalReviews = totalReviews;
    await product.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
      productRating: product.averageRating,
      totalReviews: product.totalReviews
    });
  } catch (error) {
    console.error("Create Review Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to submit review" });
  }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch reviews" });
  }
};

module.exports = {
  createReview,
  getProductReviews
};
