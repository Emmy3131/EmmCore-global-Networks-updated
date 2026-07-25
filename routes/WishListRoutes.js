const express = require("express");

const wishlistController = require("../controller/WishListController");
const authController = require("../controller/authController");

const router = express.Router();

/* ================================
   PROTECT ALL WISHLIST ROUTES
================================ */

router.use(authController.protect);

/* ================================
   GET WISHLIST
================================ */

router.get("/", wishlistController.getMyWishlist);

/* ================================
   ADD PRODUCT
================================ */

router.post("/", wishlistController.addToWishlist);

/* ================================
   TOGGLE PRODUCT
================================ */

router.post("/toggle", wishlistController.toggleWishlist);

/* ================================
   CHECK PRODUCT
================================ */

router.get("/check/:productId", wishlistController.checkWishlist);

/* ================================
   REMOVE PRODUCT
================================ */

router.delete("/:productId", wishlistController.removeFromWishlist);

module.exports = router;
