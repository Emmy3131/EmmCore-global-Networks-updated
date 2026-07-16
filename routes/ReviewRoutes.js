const express = require("express");

const router = express.Router();

const ReviewController = require("../controller/ReviewController");
const authController = require("../controller/authController");

// PUBLIC
router.get("/product/:productId", ReviewController.getProductReviews);

// USER
router.use(authController.protect);

router.post("/product/:productId", ReviewController.createReview);

router.patch("/:id", ReviewController.updateReview);

// ADMIN
router.use(authController.restrictTo("admin"));

router.get("/", ReviewController.getAllReviews);

router.patch("/:id/approve", ReviewController.approveReview);

router.patch("/:id/reject", ReviewController.rejectReview);

router.delete("/:id", ReviewController.deleteReview);

module.exports = router;
