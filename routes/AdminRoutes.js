const router = require("express").Router();

const authController = require("../controller/authController");

const referralController = require("../controller/AdminReferralController");

const withdrawalController = require("../controller/AdminWithdrawalController");

router.use(authController.protect);

router.use(authController.restrictTo("admin"));

/*
=================================
REFERRALS
=================================
*/

router.get("/referrals", referralController.getAllReferrals);

/*
=================================
WITHDRAWALS
=================================
*/

router.get("/withdrawals", withdrawalController.getAllWithdrawals);

module.exports = router;
