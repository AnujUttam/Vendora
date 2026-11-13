const PDFDocument = require("pdfkit");

/**
 * Generate invoice PDF for an order and stream to writable response
 */
const generateInvoicePDF = (order, dataCallback, endCallback) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  doc.on("data", dataCallback);
  doc.on("end", endCallback);

  // Colors
  const primaryColor = "#0f172a";
  const accentColor = "#6366f1";
  const mutedColor = "#64748b";

  // Header
  doc
    .fillColor(primaryColor)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("Vendora Marketplace", 40, 40)
    .fontSize(10)
    .font("Helvetica")
    .fillColor(mutedColor)
    .text("Empowering Independent Vendors & Smart Shoppers", 40, 68)
    .text("https://vendora.local | support@vendora.com", 40, 82);

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor(accentColor)
    .text("TAX INVOICE", 400, 40, { align: "right" })
    .fontSize(9)
    .font("Helvetica")
    .fillColor(primaryColor)
    .text(`Invoice #: INV-${order.orderNumber}`, 400, 65, { align: "right" })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 78, { align: "right" })
    .text(`Payment: ${order.paymentStatus.toUpperCase()} (${order.paymentMethod})`, 400, 91, { align: "right" });

  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, 110).lineTo(555, 110).stroke();

  // Billed To & Shipped To
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text("CUSTOMER DETAILS:", 40, 125)
    .font("Helvetica")
    .fontSize(9)
    .fillColor(mutedColor)
    .text(`Name: ${order.shippingAddress.fullName || "Customer"}`, 40, 140)
    .text(`Phone: ${order.shippingAddress.phone || "N/A"}`, 40, 153)
    .text(`Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}`, 40, 166)
    .text(`${order.shippingAddress.state} - ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`, 40, 179);

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text("ORDER SUMMARY:", 330, 125)
    .font("Helvetica")
    .fontSize(9)
    .fillColor(mutedColor)
    .text(`Order ID: ${order._id}`, 330, 140)
    .text(`Order Status: ${order.orderStatus.toUpperCase()}`, 330, 153)
    .text(`Payment ID: ${order.paymentDetails ? (order.paymentDetails.razorpayPaymentId || "N/A") : "N/A"}`, 330, 166);

  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, 205).lineTo(555, 205).stroke();

  // Items Table Header
  const tableTop = 220;
  doc
    .rect(40, tableTop - 5, 515, 22)
    .fill("#f8fafc");

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text("Item / Description", 48, tableTop)
    .text("Qty", 320, tableTop, { width: 40, align: "center" })
    .text("Unit Price", 370, tableTop, { width: 80, align: "right" })
    .text("Total (INR)", 460, tableTop, { width: 90, align: "right" });

  let yPosition = tableTop + 24;
  doc.font("Helvetica").fontSize(9);

  order.items.forEach((item, index) => {
    const itemTotal = Number(item.price) * Number(item.quantity);

    doc
      .fillColor(primaryColor)
      .text(item.name || "Product", 48, yPosition, { width: 260 })
      .fillColor(mutedColor)
      .text(String(item.quantity), 320, yPosition, { width: 40, align: "center" })
      .text(`INR ${Number(item.price).toFixed(2)}`, 370, yPosition, { width: 80, align: "right" })
      .fillColor(primaryColor)
      .text(`INR ${itemTotal.toFixed(2)}`, 460, yPosition, { width: 90, align: "right" });

    yPosition += 22;
  });

  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, yPosition + 5).lineTo(555, yPosition + 5).stroke();
  yPosition += 15;

  // Totals Breakdown
  const summaryLeft = 350;
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(mutedColor)
    .text("Items Subtotal:", summaryLeft, yPosition)
    .text(`INR ${order.totalItemsPrice.toFixed(2)}`, 460, yPosition, { width: 90, align: "right" });

  if (order.discountAmount > 0) {
    yPosition += 16;
    doc
      .fillColor("#16a34a")
      .text(`Discount (${order.couponCode || "Coupon"}):`, summaryLeft, yPosition)
      .text(`- INR ${order.discountAmount.toFixed(2)}`, 460, yPosition, { width: 90, align: "right" });
  }

  yPosition += 16;
  doc
    .fillColor(mutedColor)
    .text("Shipping Fee:", summaryLeft, yPosition)
    .text(order.shippingPrice > 0 ? `INR ${order.shippingPrice.toFixed(2)}` : "FREE", 460, yPosition, { width: 90, align: "right" });

  yPosition += 20;
  doc
    .rect(summaryLeft - 10, yPosition - 5, 215, 26)
    .fill("#eff6ff");

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(accentColor)
    .text("Total Paid:", summaryLeft, yPosition + 2)
    .text(`INR ${order.totalAmount.toFixed(2)}`, 460, yPosition + 2, { width: 90, align: "right" });

  // Footer notes
  const footerTop = 720;
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(mutedColor)
    .text("Thank you for shopping on Vendora Multi-Vendor Marketplace!", 40, footerTop, { align: "center", width: 515 })
    .text("This is a computer-generated tax invoice and requires no physical signature.", 40, footerTop + 14, { align: "center", width: 515 });

  doc.end();
};

module.exports = {
  generateInvoicePDF
};
