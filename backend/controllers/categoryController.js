const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");

const DEFAULT_CATEGORIES = [
  { _id: "650000000000000000000011", name: "Electronics", slug: "electronics", description: "Gadgets, smartphones, laptops & accessories", icon: "Laptop", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600", displayOrder: 1, productCount: 12, isActive: true },
  { _id: "650000000000000000000012", name: "Fashion", slug: "fashion", description: "Trendy clothing, footwear & lifestyle apparel", icon: "Shirt", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600", displayOrder: 2, productCount: 18, isActive: true },
  { _id: "650000000000000000000013", name: "Home & Living", slug: "home-living", description: "Home decor, kitchenware, furniture & lighting", icon: "Home", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600", displayOrder: 3, productCount: 8, isActive: true },
  { _id: "650000000000000000000014", name: "Beauty & Personal Care", slug: "beauty-personal-care", description: "Skincare, wellness, grooming & fragrances", icon: "Sparkles", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600", displayOrder: 4, productCount: 14, isActive: true },
  { _id: "650000000000000000000015", name: "Sports & Fitness", slug: "sports-fitness", description: "Workout gear, equipment & outdoor essentials", icon: "Dumbbell", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600", displayOrder: 5, productCount: 9, isActive: true },
  { _id: "650000000000000000000016", name: "Books & Stationery", slug: "books-stationery", description: "Bestselling novels, educational & desk stationery", icon: "BookOpen", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600", displayOrder: 6, productCount: 6, isActive: true }
];

// Get all categories (Public)
const getAllCategories = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: DEFAULT_CATEGORIES.length,
        categories: DEFAULT_CATEGORIES
      });
    }

    const { includeInactive } = req.query;
    const filter = includeInactive === "true" && req.user && req.user.role === "admin"
      ? {}
      : { isActive: true };

    const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });

    // Aggregate real-time product counts for each category
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      isActive: cat.isActive,
      displayOrder: cat.displayOrder,
      productCount: countMap[cat.name] || 0
    }));

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error("Get Categories Error:", error.message);
    res.status(200).json({
      success: true,
      count: DEFAULT_CATEGORIES.length,
      categories: DEFAULT_CATEGORIES
    });
  }
};

// Get single category by slug or id
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const productCount = await Product.countDocuments({ category: category.name, isActive: true });

    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch category" });
  }
};

// Create category (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, description, image, icon, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await Category.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : "",
      image: image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600",
      icon: icon || "Package",
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });
  } catch (error) {
    console.error("Create Category Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

// Update category (Admin)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, icon, displayOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (name) {
      category.name = name.trim();
      category.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) category.description = description.trim();
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
};

// Delete category (Admin)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category removed successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
