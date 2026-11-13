const mongoose = require("mongoose");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const {
  indexProduct,
  deleteProductFromES,
  searchWithElasticsearch
} = require("../services/elasticsearchService");

// Helper function: Get approved vendor
const getCurrentVendor = async (userId) => {
  return await Vendor.findOne({
    userId: userId,
    status: "approved"
  });
};

// Validate MongoDB ObjectId
const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate image URLs or relative uploads paths
const validateImages = (images) => {
  if (!Array.isArray(images)) return false;

  return images.every((image) => {
    if (typeof image !== "string") return false;
    if (image.startsWith("/uploads/") || image.startsWith("http://") || image.startsWith("https://")) {
      return true;
    }
    return false;
  });
};

// ========================================
// 1. CREATE PRODUCT
// ========================================
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      brand,
      price,
      stock,
      images
    } = req.body;

    if (
      !name ||
      !description ||
      !category ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const productPrice = Number(price);
    const productStock = Number(stock);

    if (!Number.isFinite(productPrice) || productPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero"
      });
    }

    if (!Number.isInteger(productStock) || productStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative integer"
      });
    }

    if (images !== undefined && !validateImages(images)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid image URLs"
      });
    }

    const vendor = await getCurrentVendor(req.user._id);

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: "Approved vendor profile not found"
      });
    }

    const product = await Product.create({
      vendorId: vendor._id,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      brand: brand ? brand.trim() : "Unbranded",
      price: productPrice,
      stock: productStock,
      images: images || []
    });

    // Asynchronously index in Elasticsearch
    indexProduct(product).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create product"
    });
  }
};

// ========================================
// 2. GET VENDOR PRODUCTS
// ========================================
const getVendorProducts = async (req, res) => {
  try {
    const vendor = await getCurrentVendor(req.user._id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    const products = await Product.find({
      vendorId: vendor._id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Get Vendor Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch products"
    });
  }
};

// ========================================
// 3. GET SINGLE VENDOR PRODUCT
// ========================================
const getVendorProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const vendor = await getCurrentVendor(req.user._id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    const product = await Product.findOne({
      _id: id,
      vendorId: vendor._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in your store"
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get Single Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch product"
    });
  }
};

// ========================================
// 4. UPDATE PRODUCT
// ========================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const vendor = await getCurrentVendor(req.user._id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    const product = await Product.findOne({
      _id: id,
      vendorId: vendor._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in your store"
      });
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "brand",
      "price",
      "stock",
      "images",
      "isActive"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    // Re-index in Elasticsearch
    indexProduct(product).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update product"
    });
  }
};

// ========================================
// 5. DELETE PRODUCT (SOFT DELETE)
// ========================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const vendor = await getCurrentVendor(req.user._id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    const product = await Product.findOne({
      _id: id,
      vendorId: vendor._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in your store"
      });
    }

    product.isActive = false;
    await product.save();

    // Remove from Elasticsearch
    deleteProductFromES(id).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Product removed from marketplace"
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete product"
    });
  }
};

// ========================================
// 6. PUBLIC: GET ALL PRODUCTS (ELASTICSEARCH + MONGODB DUAL ENGINE)
// ========================================
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sort = "newest",
      page = 1,
      limit = 12
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    // 1. Attempt search via Elasticsearch
    const esResult = await searchWithElasticsearch({
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort,
      page: currentPage,
      limit: pageLimit
    });

    if (esResult) {
      return res.status(200).json({
        success: true,
        ...esResult
      });
    }

    // 2. Fallback to MongoDB Query Engine
    const filter = {
      isActive: true,
      stock: { $gt: 0 }
    };

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { brand: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } }
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      rating: { averageRating: -1 }
    };

    const sortBy = sortOptions[sort] || { createdAt: -1 };
    const skip = (currentPage - 1) * pageLimit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("vendorId", "storeName")
        .sort(sortBy)
        .skip(skip)
        .limit(pageLimit),
      Product.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      source: "mongodb",
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageLimit),
      products
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch products"
    });
  }
};

// ========================================
// 7. PUBLIC: GET SINGLE PRODUCT
// ========================================
const getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true
    }).populate("vendorId", "storeName description phone");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get Public Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch product"
    });
  }
};

module.exports = {
  createProduct,
  getVendorProducts,
  getVendorProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getPublicProductById
};
