const router = require("express").Router();

const withdrawalController = require("../controller/WithrawalController");

const authController = require("../controller/authController");

router.use(authController.protect);

router.post("/", withdrawalController.requestWithdrawal);

router.get("/my", withdrawalController.getMyWithdrawals);

router.use(authController.restrictTo("admin"));

router.patch("/:id", withdrawalController.updateWithdrawalStatus);

module.exports = router;
