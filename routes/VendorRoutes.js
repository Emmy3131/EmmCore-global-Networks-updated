const express = require("express");

const router = express.Router();

const VendorController = require("../controller/VendorController");

const authController = require("../controller/authController");

// PUBLIC

router.get("/status", VendorController.getVendorStatus);

// ADMIN

router.patch(
  "/settings",
  authController.protect,
  authController.restrictTo("admin"),
  VendorController.updateVendorStatus,
);

module.exports = router;
