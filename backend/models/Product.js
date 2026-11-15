const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: 3,
      maxlength: 150
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 3000
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true
    },

    brand: {
      type: String,
      trim: true,
      default: "Unbranded"
    },

    sku: {
      type: String,
      trim: true,
      default: ""
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number"
      }
    },

    images: {
      type: [String],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    totalReviews: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Text index for basic MongoDB search
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  category: "text"
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
