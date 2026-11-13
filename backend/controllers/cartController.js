const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const {
  getCachedCart,
  setCachedCart,
  clearCachedCart
} = require("../services/redisService");

// Helper: Calculate cart total
const calculateCartTotals = (items, coupon = null) => {
  let subtotal = 0;
  items.forEach((item) => {
    subtotal += Number(item.price) * Number(item.quantity);
  });

  let discountAmount = 0;
  if (coupon && coupon.code && coupon.discountPercent) {
    const rawDiscount = (subtotal * coupon.discountPercent) / 100;
    discountAmount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

// ==========================================
// 1. GET CART
// ==========================================
const getCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Check Redis Cache first
    const cached = await getCachedCart(userId);
    if (cached) {
      return res.status(200).json({
        success: true,
        source: "redis-cache",
        cart: cached
      });
    }

    // Fallback to MongoDB
    let cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        totalAmount: 0
      });
    }

    const totals = calculateCartTotals(cart.items, cart.coupon);
    const cartResponse = {
      _id: cart._id,
      items: cart.items,
      coupon: cart.coupon,
      ...totals
    };

    // Cache in Redis
    await setCachedCart(userId, cartResponse);

    return res.status(200).json({
      success: true,
      source: "mongodb",
      cart: cartResponse
    });
  } catch (error) {
    console.error("Get Cart Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load cart" });
  }
};

// ==========================================
// 2. ADD ITEM TO CART
// ==========================================
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or unavailable" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items remaining in stock`
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Stock limit of ${product.stock} reached.`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0] : "",
        vendorId: product.vendorId,
        quantity: Number(quantity)
      });
    }

    const totals = calculateCartTotals(cart.items, cart.coupon);
    cart.totalAmount = totals.totalAmount;

    await cart.save();

    const cartResponse = {
      _id: cart._id,
      items: cart.items,
      coupon: cart.coupon,
      ...totals
    };

    // Invalidate & refresh Redis cache
    await setCachedCart(userId, cartResponse);

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: cartResponse
    });
  } catch (error) {
    console.error("Add to Cart Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to add to cart" });
  }
};

// ==========================================
// 3. UPDATE ITEM QUANTITY
// ==========================================
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: "Product ID and quantity required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (product && qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} available in stock`
        });
      }
      cart.items[itemIndex].quantity = qty;
    }

    const totals = calculateCartTotals(cart.items, cart.coupon);
    cart.totalAmount = totals.totalAmount;
    await cart.save();

    const cartResponse = {
      _id: cart._id,
      items: cart.items,
      coupon: cart.coupon,
      ...totals
    };

    await setCachedCart(userId, cartResponse);

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: cartResponse
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update cart" });
  }
};

// ==========================================
// 4. REMOVE ITEM
// ==========================================
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    const totals = calculateCartTotals(cart.items, cart.coupon);
    cart.totalAmount = totals.totalAmount;
    await cart.save();

    const cartResponse = {
      _id: cart._id,
      items: cart.items,
      coupon: cart.coupon,
      ...totals
    };

    await setCachedCart(userId, cartResponse);

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: cartResponse
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to remove item" });
  }
};

// ==========================================
// 5. CLEAR CART
// ==========================================
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], coupon: null, totalAmount: 0 }
    );
    await clearCachedCart(userId);

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart: { items: [], subtotal: 0, discountAmount: 0, totalAmount: 0 }
    });
  } catch (error) {
    console.error("Clear Cart Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to clear cart" });
  }
};

// ==========================================
// 6. APPLY COUPON
// ==========================================
const applyCoupon = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({
      code: normalizedCode,
      isActive: true,
      expiryDate: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon code"
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const { subtotal } = calculateCartTotals(cart.items);
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Coupon requires minimum order value of ₹${coupon.minOrderValue}`
      });
    }

    cart.coupon = {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxDiscount: coupon.maxDiscount
    };

    const totals = calculateCartTotals(cart.items, cart.coupon);
    cart.totalAmount = totals.totalAmount;
    await cart.save();

    const cartResponse = {
      _id: cart._id,
      items: cart.items,
      coupon: cart.coupon,
      ...totals
    };

    await setCachedCart(userId, cartResponse);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully! Saved ₹${totals.discountAmount}`,
      cart: cartResponse
    });
  } catch (error) {
    console.error("Apply Coupon Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to apply coupon" });
  }
};

// ==========================================
// 7. REMOVE COUPON
// ==========================================
const removeCoupon = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.coupon = null;
    const totals = calculateCartTotals(cart.items);
    cart.totalAmount = totals.totalAmount;
    await cart.save();

    const cartResponse = {
      _id: cart._id,
      items: cart.items,
      coupon: null,
      ...totals
    };

    await setCachedCart(userId, cartResponse);

    res.status(200).json({
      success: true,
      message: "Coupon removed",
      cart: cartResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove coupon" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon
};
