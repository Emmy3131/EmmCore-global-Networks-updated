const express = require("express");

const router = express.Router();

const vendorController = require("../controller/VendorController");

const authController = require("../controller/authController");

// PUBLIC

router.get("/status", vendorController.getVendorStatus);

// ADMIN

router.patch(
  "/settings",
  authController.protect,
  vendorController.updateVendorStatus,
);

module.exports = router;
