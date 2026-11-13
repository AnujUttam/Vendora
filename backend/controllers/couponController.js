const Coupon = require("../models/Coupon");

// Admin: Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch coupons" });
  }
};

// Admin: Create new coupon
const createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, maxDiscount, minOrderValue, expiryDate, usageLimit } = req.body;

    if (!code || !discountPercent || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount percentage, and expiry date are required"
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      discountPercent: Number(discountPercent),
      maxDiscount: maxDiscount ? Number(maxDiscount) : 1000,
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to create coupon" });
  }
};

// Customer/Public: Validate coupon
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or expired coupon" });
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to validate coupon" });
  }
};

// Admin: Delete/Deactivate coupon
const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  validateCoupon,
  deleteCoupon
};
