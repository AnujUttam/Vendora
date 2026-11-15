const express = require("express");
const router = express.Router();

const {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  checkWishlistStatus
} = require("../controllers/wishlistController");

const { protect } = require("../middleware/authMiddleware");

// All wishlist routes require customer login
router.use(protect);

router.get("/", getWishlist);
router.post("/toggle/:productId", toggleWishlist);
router.delete("/:productId", removeFromWishlist);
router.get("/check/:productId", checkWishlistStatus);

module.exports = router;
