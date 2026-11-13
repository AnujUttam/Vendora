const Vendor = require("../models/Vendor");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

// ==========================================
// VENDOR APPLICATION MANAGEMENT
// ==========================================

// Get all vendor applications
const getVendorApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application status"
        });
      }
      filter.status = status;
    }

    const applications = await Vendor.find(filter)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Get Applications Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch applications"
    });
  }
};

// Approve vendor application
const approveVendor = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor application not found"
      });
    }

    vendor.status = "approved";
    vendor.reviewedAt = new Date();
    vendor.rejectionReason = "";
    if (commissionRate !== undefined && !isNaN(commissionRate)) {
      vendor.commissionRate = Number(commissionRate);
    }

    await vendor.save();

    await User.findByIdAndUpdate(vendor.userId, {
      isApproved: true,
      role: "vendor"
    });

    res.status(200).json({
      success: true,
      message: "Vendor approved successfully",
      vendor
    });
  } catch (error) {
    console.error("Approve Vendor Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to approve vendor"
    });
  }
};

// Reject vendor application
const rejectVendor = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor application not found"
      });
    }

    vendor.status = "rejected";
    vendor.rejectionReason = reason.trim();
    vendor.reviewedAt = new Date();

    await vendor.save();

    await User.findByIdAndUpdate(vendor.userId, {
      isApproved: false
    });

    res.status(200).json({
      success: true,
      message: "Vendor application rejected",
      vendor
    });
  } catch (error) {
    console.error("Reject Vendor Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to reject vendor"
    });
  }
};

// ==========================================
// PLATFORM ANALYTICS
// ==========================================

const getPlatformAnalytics = async (req, res) => {
  try {
    // 1. User counts
    const [totalUsers, totalCustomers, totalVendors, approvedVendors, pendingVendors] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "vendor" }),
      Vendor.countDocuments({ status: "approved" }),
      Vendor.countDocuments({ status: "pending" })
    ]);

    // 2. Product counts
    const [totalProducts, activeProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true })
    ]);

    // 3. Orders analytics
    const orders = await Order.find({ paymentStatus: "paid" });

    let totalGMV = 0;
    let totalPlatformCommission = 0;
    let totalVendorPayout = 0;

    const orderStatusCounts = {
      placed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach((order) => {
      totalGMV += order.totalAmount || 0;
      totalPlatformCommission += order.platformCommissionTotal || 0;
      if (order.orderStatus && orderStatusCounts[order.orderStatus] !== undefined) {
        orderStatusCounts[order.orderStatus]++;
      }
    });

    totalVendorPayout = Math.max(0, totalGMV - totalPlatformCommission);

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .limit(6);

    // Category breakdown
    const categoryStats = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalUsers,
          totalCustomers,
          totalVendors,
          approvedVendors,
          pendingVendors,
          totalProducts,
          activeProducts,
          totalOrders: orders.length,
          totalGMV: Math.round(totalGMV * 100) / 100,
          totalPlatformCommission: Math.round(totalPlatformCommission * 100) / 100,
          totalVendorPayout: Math.round(totalVendorPayout * 100) / 100
        },
        orderStatusCounts,
        recentOrders,
        categoryStats
      }
    });
  } catch (error) {
    console.error("Platform Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to generate analytics"
    });
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch users" });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to update user" });
  }
};

// ==========================================
// ALL ORDERS (ADMIN VIEW)
// ==========================================

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("items.vendorId", "storeName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch orders" });
  }
};

module.exports = {
  getVendorApplications,
  approveVendor,
  rejectVendor,
  getPlatformAnalytics,
  getAllUsers,
  toggleUserStatus,
  getAllOrders
};
