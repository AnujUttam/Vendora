const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Vendor = require("../models/Vendor");
const { clearCachedCart } = require("../services/redisService");
const {
  calculateSplitCommissions,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../services/paymentService");
const { generateInvoicePDF } = require("../services/invoiceService");

// ==========================================
// 1. CHECKOUT ORDER
// ==========================================
const checkoutOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod = "razorpay" } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required"
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    // Validate inventory and prepare order items
    const orderItems = [];
    let totalItemsPrice = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name}' is no longer available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}`
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images && product.images[0] ? product.images[0] : "",
        vendorId: product.vendorId,
        status: "placed"
      });

      totalItemsPrice += product.price * item.quantity;
    }

    // Calculate split commissions and vendor payouts
    const { itemsWithSplits, totalPlatformCommission, vendorPayouts } =
      await calculateSplitCommissions(orderItems);

    const discountAmount = cart.coupon ? cart.coupon.discountAmount || 0 : 0;
    const totalAmount = Math.max(0, totalItemsPrice - discountAmount);

    const orderNumber = `VND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await Order.create({
      orderNumber,
      customer: userId,
      items: itemsWithSplits,
      shippingAddress,
      totalItemsPrice: Math.round(totalItemsPrice * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      couponCode: cart.coupon ? cart.coupon.code : null,
      shippingPrice: 0,
      totalAmount: Math.round(totalAmount * 100) / 100,
      platformCommissionTotal: totalPlatformCommission,
      vendorPayouts,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      orderStatus: "placed",
      trackingHistory: [
        {
          status: "placed",
          note: "Order created successfully. Awaiting payment/fulfillment.",
          updatedBy: "Customer",
          timestamp: new Date()
        }
      ]
    });

    // Decrement stock for purchased items
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user cart from DB and Redis
    await Cart.findOneAndUpdate({ userId }, { items: [], coupon: null, totalAmount: 0 });
    await clearCachedCart(userId.toString());

    // Create payment gateway order (Razorpay test mode)
    const paymentGatewayData = await createRazorpayOrder(totalAmount, order.orderNumber);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      paymentGatewayData
    });
  } catch (error) {
    console.error("Checkout Order Error:", error);
    res.status(500).json({ success: false, message: error.message || "Checkout failed" });
  }
};

// ==========================================
// 2. VERIFY PAYMENT
// ==========================================
const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    order.paymentStatus = "paid";
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
      razorpaySignature,
      paidAt: new Date()
    };
    order.trackingHistory.push({
      status: "paid",
      note: "Payment successfully received and verified via Razorpay test mode.",
      updatedBy: "Payment Gateway",
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: "Payment verification error" });
  }
};

// ==========================================
// 3. GET CUSTOMER ORDERS
// ==========================================
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
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
// 4. GET SINGLE ORDER
// ==========================================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.vendorId", "storeName phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Access control
    const isOwner = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    let isVendorOfOrder = false;

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (vendor) {
        isVendorOfOrder = order.items.some(
          (item) => item.vendorId && item.vendorId._id.toString() === vendor._id.toString()
        );
      }
    }

    if (!isOwner && !isAdmin && !isVendorOfOrder) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this order" });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch order" });
  }
};

// ==========================================
// 5. DOWNLOAD PDF INVOICE
// ==========================================
const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customer", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${order.orderNumber}.pdf"`
    );

    generateInvoicePDF(
      order,
      (chunk) => res.write(chunk),
      () => res.end()
    );
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).json({ success: false, message: "Unable to generate invoice" });
  }
};

// ==========================================
// 6. GET VENDOR'S ORDERS
// ==========================================
const getVendorOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    const orders = await Order.find({ "items.vendorId": vendor._id })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });

    // Filter items specific to this vendor for security & clarity
    const vendorSpecificOrders = orders.map((order) => {
      const myItems = order.items.filter(
        (it) => it.vendorId.toString() === vendor._id.toString()
      );
      const myEarnings = myItems.reduce((acc, it) => acc + (it.vendorPayout || 0), 0);
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        items: myItems,
        myEarnings: Math.round(myEarnings * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      count: vendorSpecificOrders.length,
      orders: vendorSpecificOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch vendor orders" });
  }
};

// ==========================================
// 7. UPDATE ORDER LIFECYCLE (VENDOR / ADMIN)
// ==========================================
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["placed", "packed", "shipped", "delivered", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.orderStatus = status;

    // Also update item statuses
    order.items.forEach((item) => {
      item.status = status;
    });

    order.trackingHistory.push({
      status,
      note: note || `Order marked as ${status}.`,
      updatedBy: req.user.role === "admin" ? "Admin" : "Vendor",
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'`,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

module.exports = {
  checkoutOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  downloadInvoice,
  getVendorOrders,
  updateOrderStatus
};
