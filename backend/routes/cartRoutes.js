const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

// All cart actions require customer authentication
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item", updateCartItem);
router.delete("/item/:productId", removeCartItem);
router.delete("/clear", clearCart);
router.post("/apply-coupon", applyCoupon);
router.delete("/remove-coupon", removeCoupon);

module.exports = router;
