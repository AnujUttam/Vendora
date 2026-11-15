require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Category = require("../models/Category");
const VendorOrder = require("../models/VendorOrder");
const Payment = require("../models/Payment");
const Commission = require("../models/Commission");
const { indexProduct } = require("../services/elasticsearchService");
const connectDB = require("../config/db");

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("Cleaning old records...");
    await Promise.all([
      User.deleteMany({}),
      Vendor.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
      VendorOrder.deleteMany({}),
      Payment.deleteMany({}),
      Commission.deleteMany({}),
      Cart.deleteMany({})
    ]);

    const defaultPassword = await bcrypt.hash("Vendora@123", 10);

    // 1. Create Admin
    console.log("Creating Admin User...");
    const adminUser = await User.create({
      name: "Vendora Platform Admin",
      email: "admin@vendora.com",
      password: defaultPassword,
      role: "admin",
      isApproved: true,
      isActive: true,
      phone: "+91 98765 00000"
    });

    // 2. Create Vendors
    console.log("Creating Vendors...");
    const vendorUser1 = await User.create({
      name: "Vikram Mehta",
      email: "techhub@vendora.com",
      password: defaultPassword,
      role: "vendor",
      isApproved: true,
      isActive: true,
      phone: "+91 98111 22233"
    });

    const vendor1 = await Vendor.create({
      userId: vendorUser1._id,
      storeName: "TechHub Electronics",
      description: "Premier distributor of modern audio, computing accessories, and smart devices.",
      phone: "+91 98111 22233",
      address: "Tower B, Cyber City, Gurugram, HR 122002",
      status: "approved",
      commissionRate: 8,
      reviewedAt: new Date()
    });

    const vendorUser2 = await User.create({
      name: "Ananya Sharma",
      email: "urbanvogue@vendora.com",
      password: defaultPassword,
      role: "vendor",
      isApproved: true,
      isActive: true,
      phone: "+91 98222 33344"
    });

    const vendor2 = await Vendor.create({
      userId: vendorUser2._id,
      storeName: "Urban Vogue Lifestyle",
      description: "Contemporary apparel, designer leather goods, and sustainable everyday fashion.",
      phone: "+91 98222 33344",
      address: "Bandra West, Linking Road, Mumbai, MH 400050",
      status: "approved",
      commissionRate: 12,
      reviewedAt: new Date()
    });

    const vendorUser3 = await User.create({
      name: "Karan Johar",
      email: "nordicliving@vendora.com",
      password: defaultPassword,
      role: "vendor",
      isApproved: true,
      isActive: true,
      phone: "+91 98333 44455"
    });

    const vendor3 = await Vendor.create({
      userId: vendorUser3._id,
      storeName: "Nordic Living & Decor",
      description: "Minimalist Scandinavian home furniture, ceramic tableware, and ambient lighting.",
      phone: "+91 98333 44455",
      address: "Indiranagar 100ft Road, Bengaluru, KA 560038",
      status: "approved",
      commissionRate: 10,
      reviewedAt: new Date()
    });

    // Pending Vendor (for Admin approval demonstration)
    const pendingVendorUser = await User.create({
      name: "Rohan Verma",
      email: "artisan@vendora.com",
      password: defaultPassword,
      role: "vendor",
      isApproved: false,
      isActive: true,
      phone: "+91 98444 55566"
    });

    await Vendor.create({
      userId: pendingVendorUser._id,
      storeName: "Artisan Woodworks Studio",
      description: "Handcrafted teak furniture and bespoke home accents made by local craftsmen.",
      phone: "+91 98444 55566",
      address: "Civil Lines, Jaipur, RJ 302006",
      status: "pending"
    });

    // 3. Create Customers
    console.log("Creating Customers...");
    const customerUser = await User.create({
      name: "Rahul Roy",
      email: "customer@vendora.com",
      password: defaultPassword,
      role: "customer",
      isApproved: true,
      isActive: true,
      phone: "+91 99000 11223",
      address: {
        street: "42 Palm Avenue, Koramangala",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560034",
        country: "India"
      }
    });

    // 4. Create Categories
    console.log("Creating Categories...");
    await Category.create([
      {
        name: "Electronics",
        slug: "electronics",
        description: "High performance audio, laptops, smart home devices, and gadgets.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        icon: "Laptop",
        displayOrder: 1
      },
      {
        name: "Fashion",
        slug: "fashion",
        description: "Designer apparel, casual wear, shoes, and luxury leather accessories.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        icon: "Shirt",
        displayOrder: 2
      },
      {
        name: "Home & Living",
        slug: "home-living",
        description: "Modern furniture, ambient lighting, kitchen essentials, and decor.",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
        icon: "Home",
        displayOrder: 3
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Backpacks, timepieces, sunglasses, and daily tech essentials.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
        icon: "Watch",
        displayOrder: 4
      },
      {
        name: "Beauty",
        slug: "beauty",
        description: "Skincare, fragrance, organic cosmetics, and self-care essentials.",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
        icon: "Sparkles",
        displayOrder: 5
      },
      {
        name: "Sports",
        slug: "sports",
        description: "Fitness equipment, athleisure, outdoor recreation, and footwear.",
        image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
        icon: "Activity",
        displayOrder: 6
      }
    ]);

    // 5. Create Coupons
    console.log("Creating Coupons...");
    await Coupon.create([
      {
        code: "WELCOME50",
        discountPercent: 50,
        maxDiscount: 500,
        minOrderValue: 999,
        expiryDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        usageLimit: 200,
        isActive: true
      },
      {
        code: "VENDORA10",
        discountPercent: 10,
        maxDiscount: 1000,
        minOrderValue: 499,
        expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000),
        usageLimit: 500,
        isActive: true
      },
      {
        code: "FESTIVE20",
        discountPercent: 20,
        maxDiscount: 2000,
        minOrderValue: 1499,
        expiryDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        usageLimit: 100,
        isActive: true
      }
    ]);

    // 5. Create Rich Products
    console.log("Creating Marketplace Products...");
    const productsData = [
      {
        vendorId: vendor1._id,
        name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        description: "Industry-leading noise canceling with two processors and eight microphones. Ultra-comfortable lightweight design with soft fit leather.",
        category: "Electronics",
        brand: "Sony",
        price: 29990,
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800"
        ],
        averageRating: 4.8,
        totalReviews: 24
      },
      {
        vendorId: vendor1._id,
        name: "Mechanical Keyboard RGB Tenkeyless Pro",
        description: "Custom mechanical linear switches, doubleshot PBT keycaps, per-key dynamic RGB backlighting, and braided detachable USB-C cable.",
        category: "Electronics",
        brand: "Keychron",
        price: 6499,
        stock: 50,
        images: [
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800"
        ],
        averageRating: 4.7,
        totalReviews: 18
      },
      {
        vendorId: vendor1._id,
        name: "Ultra-Fast Wireless Charging Stand 15W",
        description: "Qi-certified fast wireless charging dock with dual coil architecture. Supports portrait and landscape charging with intelligent thermal control.",
        category: "Electronics",
        brand: "Belkin",
        price: 2499,
        stock: 75,
        images: [
          "https://images.unsplash.com/photo-1622445262464-84b14e0745b1?w=800"
        ],
        averageRating: 4.5,
        totalReviews: 12
      },
      {
        vendorId: vendor2._id,
        name: "Classic Italian Top-Grain Leather Weekender Duffel",
        description: "Handcrafted from full-grain vegetable-tanned leather with antique brass hardware and reinforced water-resistant canvas lining.",
        category: "Accessories",
        brand: "Urban Vogue",
        price: 8990,
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"
        ],
        averageRating: 4.9,
        totalReviews: 15
      },
      {
        vendorId: vendor2._id,
        name: "Minimalist Chronograph Wristwatch 40mm",
        description: "Surgical-grade 316L stainless steel casing, scratch-resistant sapphire crystal glass, Japanese quartz movement, and interchangeable leather strap.",
        category: "Fashion",
        brand: "Vogue Horology",
        price: 4999,
        stock: 45,
        images: [
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800"
        ],
        averageRating: 4.6,
        totalReviews: 21
      },
      {
        vendorId: vendor2._id,
        name: "Tailored Linen Casual Button-Down Shirt",
        description: "Breathable 100% organic European flax linen. Tailored modern fit with mother-of-pearl buttons and relaxed pre-washed texture.",
        category: "Fashion",
        brand: "Urban Vogue",
        price: 2199,
        stock: 60,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"
        ],
        averageRating: 4.4,
        totalReviews: 9
      },
      {
        vendorId: vendor3._id,
        name: "Ceramic Hand-Poured Matte White Pour-Over Coffee Set",
        description: "Artisan stoneware dripper with matching 600ml carafe. Engineered ribbed extraction walls for balanced barista-grade pour-overs.",
        category: "Home & Living",
        brand: "Nordic Living",
        price: 1850,
        stock: 40,
        images: [
          "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800"
        ],
        averageRating: 4.8,
        totalReviews: 16
      },
      {
        vendorId: vendor3._id,
        name: "Ambient Dimmable Nordic Oak Table Lamp",
        description: "Solid natural white oak base with frosted opaline glass sphere shade. Touch-sensitive dimming with warm-glow energy-efficient LED.",
        category: "Home & Living",
        brand: "Nordic Living",
        price: 3450,
        stock: 30,
        images: [
          "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"
        ],
        averageRating: 4.7,
        totalReviews: 11
      },
      {
        vendorId: vendor1._id,
        name: "Ergonomic Aluminium Laptop Riser Stand",
        description: "Precision CNC carved aluminium alloy stand with silicone non-slip padding. Elevates screen by 6 inches for improved posture and airflow.",
        category: "Electronics",
        brand: "TechHub",
        price: 1599,
        stock: 80,
        images: [
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800"
        ],
        averageRating: 4.6,
        totalReviews: 32
      }
    ];

    const createdProducts = await Product.insertMany(productsData);

    // Index products in Elasticsearch if reachable
    for (const prod of createdProducts) {
      await indexProduct(prod);
    }

    // 6. Create Reviews
    console.log("Creating Verified Customer Reviews...");
    await Review.create([
      {
        userId: customerUser._id,
        userName: customerUser.name,
        productId: createdProducts[0]._id,
        rating: 5,
        title: "Spectacular noise cancelling!",
        comment: "The battery life is exceptional and ANC cuts out all office distractions. Worth every single rupee.",
        verifiedPurchase: true
      },
      {
        userId: customerUser._id,
        userName: customerUser.name,
        productId: createdProducts[3]._id,
        rating: 5,
        title: "Supreme leather craftsmanship",
        comment: "Rich smell of genuine leather. Fits clothes for a 3-day weekend effortlessly and looks dashing.",
        verifiedPurchase: true
      }
    ]);

    // 7. Create Sample Multi-Vendor Orders showcasing lifecycle states
    console.log("Creating Sample Multi-Vendor Orders with Lifecycle Stages...");
    const sampleOrders = [
      {
        orderNumber: "VND-2026-001",
        customer: customerUser._id,
        items: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].name,
            price: createdProducts[0].price,
            quantity: 1,
            image: createdProducts[0].images[0],
            vendorId: vendor1._id,
            commissionRate: 8,
            commissionAmount: 2399.2,
            vendorPayout: 27590.8,
            status: "delivered"
          },
          {
            product: createdProducts[6]._id,
            name: createdProducts[6].name,
            price: createdProducts[6].price,
            quantity: 1,
            image: createdProducts[6].images[0],
            vendorId: vendor3._id,
            commissionRate: 10,
            commissionAmount: 185.0,
            vendorPayout: 1665.0,
            status: "delivered"
          }
        ],
        shippingAddress: {
          fullName: customerUser.name,
          phone: customerUser.phone,
          street: customerUser.address.street,
          city: customerUser.address.city,
          state: customerUser.address.state,
          postalCode: customerUser.address.postalCode,
          country: customerUser.address.country
        },
        totalItemsPrice: 31840,
        discountAmount: 1000,
        couponCode: "VENDORA10",
        shippingPrice: 0,
        totalAmount: 30840,
        platformCommissionTotal: 2584.2,
        vendorPayouts: [
          { vendorId: vendor1._id, storeName: vendor1.storeName, amount: 27590.8, commission: 2399.2 },
          { vendorId: vendor3._id, storeName: vendor3.storeName, amount: 1665.0, commission: 185.0 }
        ],
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        paymentDetails: {
          razorpayOrderId: "order_mock_001",
          razorpayPaymentId: "pay_mock_test_001",
          paidAt: new Date(Date.now() - 4 * 24 * 3600 * 1000)
        },
        orderStatus: "delivered",
        trackingHistory: [
          { status: "placed", note: "Order placed and paid", timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
          { status: "packed", note: "Items packed by vendors", timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
          { status: "shipped", note: "Handed over to Bluedart logistics", timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
          { status: "delivered", note: "Delivered to customer doorstep", timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000) }
        ]
      },
      {
        orderNumber: "VND-2026-002",
        customer: customerUser._id,
        items: [
          {
            product: createdProducts[1]._id,
            name: createdProducts[1].name,
            price: createdProducts[1].price,
            quantity: 1,
            image: createdProducts[1].images[0],
            vendorId: vendor1._id,
            commissionRate: 8,
            commissionAmount: 519.92,
            vendorPayout: 5979.08,
            status: "shipped"
          }
        ],
        shippingAddress: {
          fullName: customerUser.name,
          phone: customerUser.phone,
          street: customerUser.address.street,
          city: customerUser.address.city,
          state: customerUser.address.state,
          postalCode: customerUser.address.postalCode,
          country: customerUser.address.country
        },
        totalItemsPrice: 6499,
        discountAmount: 500,
        couponCode: "WELCOME50",
        shippingPrice: 0,
        totalAmount: 5999,
        platformCommissionTotal: 519.92,
        vendorPayouts: [
          { vendorId: vendor1._id, storeName: vendor1.storeName, amount: 5979.08, commission: 519.92 }
        ],
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        paymentDetails: {
          razorpayOrderId: "order_mock_002",
          razorpayPaymentId: "pay_mock_test_002",
          paidAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
        },
        orderStatus: "shipped",
        trackingHistory: [
          { status: "placed", note: "Order verified", timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
          { status: "packed", note: "Packed by TechHub", timestamp: new Date(Date.now() - 18 * 3600 * 1000) },
          { status: "shipped", note: "Dispatched via Express Courier", timestamp: new Date(Date.now() - 6 * 3600 * 1000) }
        ]
      }
    ];

    const createdOrders = await Order.insertMany(sampleOrders);

    // Create corresponding VendorOrder, Payment, and Commission records
    for (const ord of createdOrders) {
      await Payment.create({
        orderId: ord._id,
        orderNumber: ord.orderNumber,
        customer: ord.customer,
        amount: ord.totalAmount,
        currency: "INR",
        paymentMethod: ord.paymentMethod,
        paymentStatus: ord.paymentStatus,
        razorpayOrderId: ord.paymentDetails?.razorpayOrderId || "order_mock",
        razorpayPaymentId: ord.paymentDetails?.razorpayPaymentId || "pay_mock",
        paidAt: ord.paymentDetails?.paidAt || new Date()
      });

      // Split items by vendor
      const vendorItems = new Map();
      ord.items.forEach((it) => {
        const vKey = it.vendorId.toString();
        if (!vendorItems.has(vKey)) vendorItems.set(vKey, []);
        vendorItems.get(vKey).push(it);
      });

      let subIdx = 1;
      for (const [vId, items] of vendorItems.entries()) {
        const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const commRate = items[0].commissionRate || 10;
        const commAmt = items.reduce((acc, it) => acc + (it.commissionAmount || 0), 0);
        const payout = items.reduce((acc, it) => acc + (it.vendorPayout || 0), 0);

        const vOrder = await VendorOrder.create({
          parentOrderId: ord._id,
          parentOrderNumber: ord.orderNumber,
          vendorOrderNumber: `${ord.orderNumber}-V${subIdx++}`,
          vendorId: vId,
          customer: ord.customer,
          items: items.map((it) => ({
            product: it.product,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            image: it.image,
            status: it.status
          })),
          subtotal,
          commissionRate: commRate,
          commissionAmount: commAmt,
          vendorPayout: payout,
          status: ord.orderStatus,
          shippingAddress: ord.shippingAddress,
          paymentStatus: ord.paymentStatus,
          trackingHistory: ord.trackingHistory
        });

        await Commission.create({
          orderId: ord._id,
          vendorOrderId: vOrder._id,
          vendorId: vId,
          orderTotal: subtotal,
          commissionRate: commRate,
          commissionAmount: commAmt,
          vendorPayout: payout,
          status: "settled"
        });
      }
    }

    console.log("==================================================");
    console.log("Vendora Marketplace Database Seeded Successfully!");
    console.log("==================================================");
    console.log("Demo Credentials:");
    console.log("1. Admin:    admin@vendora.com / Vendora@123");
    console.log("2. Vendor 1: techhub@vendora.com / Vendora@123");
    console.log("3. Vendor 2: urbanvogue@vendora.com / Vendora@123");
    console.log("4. Customer: customer@vendora.com / Vendora@123");
    console.log("==================================================");

    process.exit(0);
  } catch (err) {
    console.error("Seed Data Error:", err);
    process.exit(1);
  }
};

seedDatabase();
