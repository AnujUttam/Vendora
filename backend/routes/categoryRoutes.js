const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug);

// Admin-only routes
router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;
