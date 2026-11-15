const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const VendorOrder = require("../models/VendorOrder");

// Apply to become a vendor
const applyVendor = async (req, res) => {
  try {
    const { storeName, description, phone, address } = req.body;

    if (!storeName || !description || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "All store details are required"
      });
    }

    // Only customers can apply
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can apply for a vendor account"
      });
    }

    // Check existing application
    const existingVendor = await Vendor.findOne({
      userId: req.user._id
    });

    if (existingVendor) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a vendor application",
        status: existingVendor.status
      });
    }

    const vendor = await Vendor.create({
      userId: req.user._id,
      storeName: storeName.trim(),
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: "pending"
    });

    // Change user role, but keep selling access disabled
    await User.findByIdAndUpdate(req.user._id, {
      role: "vendor",
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: "Vendor application submitted successfully. Pending admin review.",
      vendor
    });
  } catch (error) {
    console.error("Vendor Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to submit vendor application"
    });
  }
};

// Get current vendor profile
const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      userId: req.user._id
    }).populate("userId", "name email");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    res.status(200).json({
      success: true,
      vendor
    });
  } catch (error) {
    console.error("Vendor Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch vendor profile"
    });
  }
};

// Update vendor store profile & settings
const updateVendorProfile = async (req, res) => {
  try {
    const { storeName, description, phone, address, logo, banner, bankDetails } = req.body;

    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    if (storeName) vendor.storeName = storeName.trim();
    if (description) vendor.description = description.trim();
    if (phone) vendor.phone = phone.trim();
    if (address) vendor.address = address.trim();
    if (logo) vendor.logo = logo;
    if (banner) vendor.banner = banner;
    if (bankDetails) {
      vendor.bankDetails = {
        ...vendor.bankDetails,
        ...bankDetails
      };
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Store profile updated successfully",
      vendor
    });
  } catch (error) {
    console.error("Update Vendor Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor profile"
    });
  }
};

// Get own application status
const getApplicationStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      userId: req.user._id
    }).select("storeName status rejectionReason createdAt reviewedAt");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "No vendor application found"
      });
    }

    res.status(200).json({
      success: true,
      application: vendor
    });
  } catch (error) {
    console.error("Application Status Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch application status"
    });
  }
};

// Public vendor store details & products
const getPublicVendorStore = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(404).json({
        success: false,
        message: "Vendor store not found or is currently inactive"
      });
    }

    const vendor = await Vendor.findOne({ _id: vendorId, status: "approved" })
      .select("storeName description phone address logo banner commissionRate createdAt");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor store not found or is currently inactive"
      });
    }

    const products = await Product.find({
      vendorId: vendor._id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      store: vendor,
      productsCount: products.length,
      products
    });
  } catch (error) {
    console.error("Public Vendor Store Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load vendor storefront"
    });
  }
};

// Vendor analytics & dashboard stats
const getVendorDashboardStats = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    const [totalProducts, activeProducts, lowStockProducts] = await Promise.all([
      Product.countDocuments({ vendorId: vendor._id }),
      Product.countDocuments({ vendorId: vendor._id, isActive: true }),
      Product.countDocuments({ vendorId: vendor._id, stock: { $lte: 5 } })
    ]);

    // Query vendor sub-orders or matching parent orders
    const orders = await Order.find({
      "items.vendorId": vendor._id,
      paymentStatus: "paid"
    });

    let totalRevenue = 0;
    let totalCommission = 0;
    let netEarnings = 0;
    let pendingFulfillment = 0;
    let completedOrders = 0;

    orders.forEach((order) => {
      const myItems = order.items.filter((it) => it.vendorId.toString() === vendor._id.toString());
      myItems.forEach((it) => {
        const itemTotal = it.price * it.quantity;
        const comm = it.commissionAmount || (itemTotal * (it.commissionRate || 10)) / 100;
        const payout = it.vendorPayout || itemTotal - comm;

        totalRevenue += itemTotal;
        totalCommission += comm;
        netEarnings += payout;

        if (it.status === "placed" || it.status === "packed") pendingFulfillment++;
        if (it.status === "delivered") completedOrders++;
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders: orders.length,
        pendingFulfillment,
        completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        netEarnings: Math.round(netEarnings * 100) / 100,
        commissionRate: vendor.commissionRate
      }
    });
  } catch (error) {
    console.error("Vendor Dashboard Stats Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load dashboard statistics" });
  }
};

module.exports = {
  applyVendor,
  getVendorProfile,
  updateVendorProfile,
  getApplicationStatus,
  getPublicVendorStore,
  getVendorDashboardStats
};
