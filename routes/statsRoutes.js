const express = require("express");
const router = express.Router();
const statsController = require("../controller/StatsController");
const authController = require('../controller/authController')

router.get("/dashboard-stats", statsController.getStats);

router.get(
  "/sales-overview",
  authController.protect,
  statsController.getSalesOverview
);

module.exports = router;