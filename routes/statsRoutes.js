const express = require("express");
const router = express.Router();
const statsController = require("../controller/statsControllers");

router.get("/dashboard-stats", statsController.getStats);

module.exports = router;