const express = require("express");

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