const Vendor = require("../models/Vendor");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Category = require("../models/Category");
const { deleteProductFromES } = require("../services/elasticsearchService");

// ==========================================
// VENDOR APPLICATION & MANAGEMENT
// ==========================================

// Get all vendor applications
const getVendorApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
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

// Suspend or Reactivate Vendor
const toggleVendorStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const newStatus = vendor.status === "suspended" ? "approved" : "suspended";
    vendor.status = newStatus;
    await vendor.save();

    // Sync user approval state
    await User.findByIdAndUpdate(vendor.userId, {
      isApproved: newStatus === "approved"
    });

    res.status(200).json({
      success: true,
      message: `Vendor account ${newStatus === "suspended" ? "suspended" : "reactivated"} successfully`,
      vendor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle vendor status" });
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

    // Recent orders
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
    const { search, role } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
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
// PRODUCT MODERATION (ADMIN)
// ==========================================

const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(filter)
      .populate("vendorId", "storeName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch products" });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to toggle product status" });
  }
};

const deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    deleteProductFromES(req.params.id).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Product removed from marketplace successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to delete product" });
  }
};

// ==========================================
// ALL ORDERS (ADMIN VIEW)
// ==========================================

const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate("customer", "name email phone")
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

// ==========================================
// COMMISSION & PAYOUT LEDGER
// ==========================================

const getCommissionLedger = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: "approved" }).select("storeName commissionRate phone");
    const orders = await Order.find({ paymentStatus: "paid" });

    const vendorLedgerMap = new Map();

    vendors.forEach((v) => {
      vendorLedgerMap.set(v._id.toString(), {
        vendorId: v._id,
        storeName: v.storeName,
        commissionRate: v.commissionRate,
        grossSales: 0,
        platformCommission: 0,
        netVendorPayout: 0,
        ordersCount: 0
      });
    });

    orders.forEach((ord) => {
      if (ord.vendorPayouts && ord.vendorPayouts.length > 0) {
        ord.vendorPayouts.forEach((vp) => {
          const vKey = vp.vendorId ? vp.vendorId.toString() : null;
          if (vKey && vendorLedgerMap.has(vKey)) {
            const entry = vendorLedgerMap.get(vKey);
            entry.grossSales += (vp.amount || 0) + (vp.commission || 0);
            entry.platformCommission += vp.commission || 0;
            entry.netVendorPayout += vp.amount || 0;
            entry.ordersCount++;
          }
        });
      }
    });

    const ledger = Array.from(vendorLedgerMap.values()).map((row) => ({
      ...row,
      grossSales: Math.round(row.grossSales * 100) / 100,
      platformCommission: Math.round(row.platformCommission * 100) / 100,
      netVendorPayout: Math.round(row.netVendorPayout * 100) / 100
    }));

    res.status(200).json({
      success: true,
      ledger
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate commission ledger" });
  }
};

module.exports = {
  getVendorApplications,
  approveVendor,
  rejectVendor,
  toggleVendorStatus,
  getPlatformAnalytics,
  getAllUsers,
  toggleUserStatus,
  getAllProductsAdmin,
  toggleProductStatus,
  deleteProductAdmin,
  getAllOrders,
  getCommissionLedger
};
