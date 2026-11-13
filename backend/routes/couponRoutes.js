const express = require("express");
const router = express.Router();

const {
  getAllCoupons,
  createCoupon,
  validateCoupon,
  deleteCoupon
} = require("../controllers/couponController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Customer can validate coupon
router.post("/validate", protect, validateCoupon);

// Admin coupon management
router.get("/", protect, authorize("admin"), getAllCoupons);
router.post("/", protect, authorize("admin"), createCoupon);
router.delete("/:id", protect, authorize("admin"), deleteCoupon);

module.exports = router;
