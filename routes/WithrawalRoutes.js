const express = require("express");

const WithdrawalController = require("../controller/WithrawalController");
const authController = require("../controller/authController");

const router = express.Router();

/*
=====================================================
PROTECT ALL ROUTES
=====================================================
*/

router.use(authController.protect);

/*
=====================================================
USER BANK ACCOUNT
=====================================================
*/

router
  .route("/bank-account")
  .get(WithdrawalController.getMyBankAccount)
  .post(WithdrawalController.saveBankAccount);

/*
=====================================================
USER WITHDRAWALS
=====================================================
*/

router
  .route("/")
  .get(WithdrawalController.getMyWithdrawals)
  .post(WithdrawalController.requestWithdrawal);

/*
=====================================================
ADMIN WITHDRAWALS
=====================================================
*/

router.get(
  "/admin/all",
  authController.restrictTo("admin"),
  WithdrawalController.getAllWithdrawals,
);

router.patch(
  "/admin/:id/approve",
  authController.restrictTo("admin"),
  WithdrawalController.approveWithdrawal,
);

router.patch(
  "/admin/:id/reject",
  authController.restrictTo("admin"),
  WithdrawalController.rejectWithdrawal,
);

router.patch(
  "/admin/:id/paid",
  authController.restrictTo("admin"),
  WithdrawalController.markWithdrawalPaid,
);

/*
=====================================================
SINGLE USER WITHDRAWAL
=====================================================
*/

router.get("/:id", WithdrawalController.getWithdrawal);

module.exports = router;
