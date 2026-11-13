const express = require("express");
const router = express.Router();

const {
  createReview,
  getProductReviews
} = require("../controllers/reviewController");

const { protect } = require("../middleware/authMiddleware");

// Public can read product reviews
router.get("/product/:productId", getProductReviews);

// Logged-in customer can post a review
router.post("/", protect, createReview);

module.exports = router;
