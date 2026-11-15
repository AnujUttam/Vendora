const mongoose = require("mongoose");
const Order = require("../models/Order");
const VendorOrder = require("../models/VendorOrder");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Vendor = require("../models/Vendor");
const Payment = require("../models/Payment");
const Commission = require("../models/Commission");
const Notification = require("../models/Notification");
const { clearCachedCart } = require("../services/redisService");
const {
  calculateSplitCommissions,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../services/paymentService");
const { generateInvoicePDF } = require("../services/invoiceService");

// ==========================================
// 1. CHECKOUT ORDER (MULTI-VENDOR SPLIT)
// ==========================================
const checkoutOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod = "razorpay" } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
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
        sku: product.sku || "",
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

    // Create Customer Parent Order
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

    // Create Vendor-specific Sub-Orders (VendorOrder) for each vendor
    const vendorItemsMap = new Map();
    itemsWithSplits.forEach((it) => {
      const vKey = it.vendorId.toString();
      if (!vendorItemsMap.has(vKey)) {
        vendorItemsMap.set(vKey, []);
      }
      vendorItemsMap.get(vKey).push(it);
    });

    let vendorIdx = 1;
    for (const [vId, vItems] of vendorItemsMap.entries()) {
      const vPayoutObj = vendorPayouts.find((vp) => vp.vendorId.toString() === vId) || {};
      const subtotal = vItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

      const vendorOrder = await VendorOrder.create({
        parentOrderId: order._id,
        parentOrderNumber: order.orderNumber,
        vendorOrderNumber: `${order.orderNumber}-V${vendorIdx++}`,
        vendorId: vId,
        customer: userId,
        items: vItems.map((it) => ({
          product: it.product,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          sku: it.sku,
          status: "placed"
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        commissionRate: vPayoutObj.commission ? Math.round((vPayoutObj.commission / subtotal) * 100) : 10,
        commissionAmount: vPayoutObj.commission || 0,
        vendorPayout: vPayoutObj.amount || Math.max(0, subtotal - (vPayoutObj.commission || 0)),
        status: "placed",
        shippingAddress,
        paymentStatus: order.paymentStatus,
        trackingHistory: [
          {
            status: "placed",
            note: "New multi-vendor order item received.",
            updatedBy: "System",
            timestamp: new Date()
          }
        ]
      });

      // Record Commission audit ledger
      await Commission.create({
        orderId: order._id,
        vendorOrderId: vendorOrder._id,
        vendorId: vId,
        orderTotal: subtotal,
        commissionRate: vendorOrder.commissionRate,
        commissionAmount: vendorOrder.commissionAmount,
        vendorPayout: vendorOrder.vendorPayout,
        status: "pending"
      });
    }

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

    // Record initial Payment record
    await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: userId,
      amount: totalAmount,
      currency: "INR",
      paymentMethod,
      paymentStatus: "created",
      razorpayOrderId: paymentGatewayData.orderId,
      gatewayResponse: paymentGatewayData
    });

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
// 2. VERIFY PAYMENT (TEST OR LIVE RAZORPAY)
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

      await Payment.findOneAndUpdate(
        { orderId: order._id },
        { paymentStatus: "failed", errorReason: "Signature verification failed" }
      );

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
      note: "Payment successfully received and verified via Razorpay.",
      updatedBy: "Payment Gateway",
      timestamp: new Date()
    });

    await order.save();

    // Update all linked VendorOrder sub-orders
    await VendorOrder.updateMany(
      { parentOrderId: order._id },
      { paymentStatus: "paid" }
    );

    // Update Payment ledger
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        paymentStatus: "paid",
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
        razorpaySignature,
        paidAt: new Date()
      }
    );

    // Create in-app Notification for customer
    await Notification.create({
      recipient: order.customer,
      title: "Order Placed & Paid",
      message: `Your payment for order ${order.orderNumber} (₹${order.totalAmount}) was confirmed.`,
      type: "order",
      link: `/my-orders`
    });

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
// 4. GET SINGLE ORDER (WITH SUB-ORDERS)
// ==========================================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.vendorId", "storeName phone logo address");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Access control
    const isOwner = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    let isVendorOfOrder = false;
    let vendorObj = null;

    if (req.user.role === "vendor") {
      vendorObj = await Vendor.findOne({ userId: req.user._id });
      if (vendorObj) {
        isVendorOfOrder = order.items.some(
          (item) => item.vendorId && item.vendorId._id.toString() === vendorObj._id.toString()
        );
      }
    }

    if (!isOwner && !isAdmin && !isVendorOfOrder) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this order" });
    }

    // Fetch vendor sub-orders
    let subOrders = [];
    if (isAdmin || isOwner) {
      subOrders = await VendorOrder.find({ parentOrderId: order._id }).populate("vendorId", "storeName phone");
    } else if (vendorObj) {
      subOrders = await VendorOrder.find({
        parentOrderId: order._id,
        vendorId: vendorObj._id
      }).populate("vendorId", "storeName phone");
    }

    res.status(200).json({
      success: true,
      order,
      subOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch order" });
  }
};

// ==========================================
// 5. CANCEL ORDER (CUSTOMER / ADMIN)
// ==========================================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Cancelled by user" } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this order" });
    }

    if (order.orderStatus === "delivered" || order.orderStatus === "shipped") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled once it is ${order.orderStatus}`
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    order.orderStatus = "cancelled";
    order.trackingHistory.push({
      status: "cancelled",
      note: reason,
      updatedBy: isAdmin ? "Admin" : "Customer",
      timestamp: new Date()
    });

    await order.save();

    // Update Vendor Orders
    await VendorOrder.updateMany(
      { parentOrderId: order._id },
      {
        status: "cancelled",
        $push: {
          trackingHistory: {
            status: "cancelled",
            note: reason,
            updatedBy: "System",
            timestamp: new Date()
          }
        }
      }
    );

    // Restore Product Inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully. Inventory restored.",
      order
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ success: false, message: "Unable to cancel order" });
  }
};

// ==========================================
// 6. DOWNLOAD PDF INVOICE
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
// 7. GET VENDOR'S SUB-ORDERS
// ==========================================
const getVendorOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    // Try finding dedicated VendorOrder documents first
    let vendorOrders = await VendorOrder.find({ vendorId: vendor._id })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });

    // Fallback if older orders were created before VendorOrder schema
    if (vendorOrders.length === 0) {
      const parentOrders = await Order.find({ "items.vendorId": vendor._id })
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 });

      vendorOrders = parentOrders.map((ord) => {
        const myItems = ord.items.filter((it) => it.vendorId.toString() === vendor._id.toString());
        const subtotal = myItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const myEarnings = myItems.reduce((acc, it) => acc + (it.vendorPayout || 0), 0);

        return {
          _id: ord._id,
          parentOrderId: ord._id,
          parentOrderNumber: ord.orderNumber,
          vendorOrderNumber: ord.orderNumber,
          customer: ord.customer,
          shippingAddress: ord.shippingAddress,
          paymentStatus: ord.paymentStatus,
          status: ord.orderStatus,
          createdAt: ord.createdAt,
          items: myItems,
          subtotal,
          vendorPayout: Math.round(myEarnings * 100) / 100
        };
      });
    }

    res.status(200).json({
      success: true,
      count: vendorOrders.length,
      orders: vendorOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch vendor orders" });
  }
};

// ==========================================
// 8. UPDATE ORDER LIFECYCLE (VENDOR / ADMIN)
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

    // Sync VendorOrders
    await VendorOrder.updateMany(
      { parentOrderId: order._id },
      {
        status,
        $push: {
          trackingHistory: {
            status,
            note: note || `Sub-order marked as ${status}`,
            updatedBy: req.user.role === "admin" ? "Admin" : "Vendor",
            timestamp: new Date()
          }
        }
      }
    );

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
  cancelOrder,
  downloadInvoice,
  getVendorOrders,
  updateOrderStatus
};
