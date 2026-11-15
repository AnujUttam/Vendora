const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: 80
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"
    },
    icon: {
      type: String,
      default: "Package"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ isActive: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
