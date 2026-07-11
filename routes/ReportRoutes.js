const express = require("express");

const router = express.Router();

const reportController = require("../controller/ReportController");

const authController = require("../controller/authController");

router.use(authController.protect);

router.use(authController.restrictTo("admin"));

router.get("/", reportController.getReports);

module.exports = router;
