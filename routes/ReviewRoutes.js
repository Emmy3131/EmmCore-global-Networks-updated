const express = require("express");
const authController = require("../controller/authController");
const reviewController = require("../controller/ReviewController")

const router = express.Router();

router.use(authController.protect);

router.post("/:productId", reviewController.createReview);

router.patch("/:id", reviewController.updateReview);

router.delete("/:id", reviewController.deleteReview);

router.get("/product/:productId", reviewController.getProductReviews);

router.get("/", authController.restrictTo("admin"), reviewController.getAllReviews);

router.patch(
    "/approve/:id",
    authController.restrictTo("admin"),
    reviewController.approveReview
);

console.log({
  protect: typeof authController.protect,
  restrictTo: typeof authController.restrictTo,

  createReview: typeof ReviewController.createReview,
  getProductReviews: typeof ReviewController.getProductReviews,
  getAllReviews: typeof ReviewController.getAllReviews,
  updateReview: typeof ReviewController.updateReview,
  approveReview: typeof ReviewController.approveReview,
  rejectReview: typeof ReviewController.rejectReview,
  deleteReview: typeof ReviewController.deleteReview,
});