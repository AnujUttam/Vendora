const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// Get customer wishlist
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ userId }).populate({
      path: "products",
      match: { isActive: true },
      populate: { path: "vendorId", select: "storeName" }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [] });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      wishlist: wishlist.products
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch wishlist" });
  }
};

// Toggle product in wishlist (Add if not present, remove if present)
const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found or unavailable" });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [productId] });
      return res.status(200).json({
        success: true,
        action: "added",
        message: "Product added to wishlist",
        isInWishlist: true,
        count: 1
      });
    }

    const index = wishlist.products.findIndex((id) => id.toString() === productId);
    let action = "added";

    if (index > -1) {
      wishlist.products.splice(index, 1);
      action = "removed";
    } else {
      wishlist.products.push(productId);
      action = "added";
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      action,
      message: action === "added" ? "Product added to wishlist" : "Product removed from wishlist",
      isInWishlist: action === "added",
      count: wishlist.products.length
    });
  } catch (error) {
    console.error("Toggle Wishlist Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update wishlist" });
  }
};

// Remove single product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(200).json({ success: true, message: "Wishlist is already empty" });
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      count: wishlist.products.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove from wishlist" });
  }
};

// Check if product is in wishlist
const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });
    const isInWishlist = wishlist ? wishlist.products.some((id) => id.toString() === productId) : false;

    res.status(200).json({
      success: true,
      isInWishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to check wishlist status" });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  checkWishlistStatus
};
