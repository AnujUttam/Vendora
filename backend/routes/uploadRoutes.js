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

// Single image upload
router.post("/", protect, approvedVendor, upload.single("image"), async (req, res) => {
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

module.exports = router;
