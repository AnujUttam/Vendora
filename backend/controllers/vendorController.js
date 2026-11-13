
const Vendor = require("../models/Vendor");
const User = require("../models/User");

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
      storeName,
      description,
      phone,
      address
    });

    // Change user role, but keep selling access disabled
    await User.findByIdAndUpdate(req.user._id, {
      role: "vendor",
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: "Vendor application submitted successfully",
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

module.exports = {
  applyVendor,
  getVendorProfile,
  getApplicationStatus
};
