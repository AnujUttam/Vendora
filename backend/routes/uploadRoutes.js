const express = require("express");
const multer = require("multer");
const { uploadToS3 } = require("../services/s3Service");
const { protect, approvedVendor } = require("../middleware/authMiddleware");

const router = express.Router();

// Memory storage for file buffers to pass to S3 or local fallback
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

// Single image upload (Product / Store Logo / Banner)
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const result = await uploadToS3(req.file);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: result.url,
      provider: result.provider
    });
  } catch (error) {
    console.error("Image Upload Error:", error.message);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
});

// Multiple image upload (Product Gallery)
router.post("/multiple", protect, approvedVendor, upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image files provided" });
    }

    const uploadPromises = req.files.map((file) => uploadToS3(file));
    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${results.length} images uploaded successfully`,
      urls: results.map((r) => r.url),
      providers: results.map((r) => r.provider)
    });
  } catch (error) {
    console.error("Multiple Image Upload Error:", error.message);
    res.status(500).json({ success: false, message: "Multiple image upload failed" });
  }
});

module.exports = router;
