const express = require("express");
const router = express.Router();

const {
  register,
  login,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isApproved: req.user.isApproved,
      phone: req.user.phone,
      avatar: req.user.avatar,
      address: req.user.address
    }
  });
});

router.put("/profile", protect, updateProfile);

// Address Management
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.delete("/addresses/:id", protect, deleteAddress);
router.put("/addresses/:id/default", protect, setDefaultAddress);

module.exports = router;
