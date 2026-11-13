
const express = require("express");

const router = express.Router();

const {
  getAllProducts,
  getPublicProductById
} = require("../controllers/productController");


// Get all active products
router.get("/", getAllProducts);

// Get product by ID
router.get("/:id", getPublicProductById);


module.exports = router;
