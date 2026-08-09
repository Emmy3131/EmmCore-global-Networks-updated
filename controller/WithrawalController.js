const Withdrawal = require("../model/WithdrawalModel");
const BankAccount = require("../model/BankDetailsModel");
const User = require("../model/UserModel");
const WalletTransaction = require("../model/WalletTransanctionModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/*
=====================================================
MINIMUM WITHDRAWAL
=====================================================
*/

const MINIMUM_WITHDRAWAL = 5000;

/*
=====================================================
GET SAVED BANK ACCOUNT
=====================================================
*/

exports.getMyBankAccount = catchAsync(
  async (req, res, next) => {
    const account = await BankAccount.findOne({
      user: req.user._id,
    });

    res.status(200).json({
      status: "success",
      data: account,
    });
  },
);

/*
=====================================================
SAVE / UPDATE BANK ACCOUNT
=====================================================
*/

exports.saveBankAccount = catchAsync(
  async (req, res, next) => {
    const {
      bankName,
      accountName,
      accountNumber,
    } = req.body;

    if (
      !bankName ||
      !accountName ||
      !accountNumber
    ) {
      return next(
        new AppError(
          "Bank name, account name and account number are required",
          400,
        ),
      );
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return next(
        new AppError(
          "Account number must contain exactly 10 digits",
          400,
        ),
      );
    }

    const account =
      await BankAccount.findOneAndUpdate(
        {
          user: req.user._id,
        },
        {
          user: req.user._id,
          bankName,
          accountName,
          accountNumber,
          isVerified: false,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

    res.status(200).json({
      status: "success",
      message: "Bank account saved successfully",
      data: account,
    });
  },
);

/*
=====================================================
REQUEST WITHDRAWAL
=====================================================
*/

exports.requestWithdrawal = catchAsync(
  async (req, res, next) => {
    const amount = Number(req.body.amount);

    /*
    =====================================================
    VALIDATE AMOUNT
    =====================================================
    */

    if (!amount || amount <= 0) {
      return next(
        new AppError(
          "Please enter a valid withdrawal amount",
          400,
        ),
      );
    }

    if (amount < MINIMUM_WITHDRAWAL) {
      return next(
        new AppError(
          `Minimum withdrawal is ₦${MINIMUM_WITHDRAWAL.toLocaleString()}`,
          400,
        ),
      );
    }

    /*
    =====================================================
    GET USER
    =====================================================
    */

    const user = await User.findById(
      req.user._id,
    ).select("_id walletBalance");

    if (!user) {
      return next(
        new AppError("User not found", 404),
      );
    }

    const walletBalance =
      user.walletBalance || 0;

    /*
    =====================================================
    CHECK BALANCE
    =====================================================
    */

    if (amount > walletBalance) {
      return next(
        new AppError(
          "Insufficient wallet balance",
          400,
        ),
      );
    }

    /*
    =====================================================
    CHECK EXISTING PENDING WITHDRAWAL
    =====================================================
    */

    const existingWithdrawal =
      await Withdrawal.findOne({
        user: user._id,
        status: "pending",
      });

    if (existingWithdrawal) {
      return next(
        new AppError(
          "You already have a pending withdrawal request",
          400,
        ),
      );
    }

    /*
    =====================================================
    GET BANK ACCOUNT
    =====================================================
    */

    const bankAccount =
      await BankAccount.findOne({
        user: user._id,
      });

    if (!bankAccount) {
      return next(
        new AppError(
          "Please add your withdrawal bank account first",
          400,
        ),
      );
    }

    /*
    =====================================================
    CREATE WITHDRAWAL
    =====================================================
    */

    const withdrawal =
      await Withdrawal.create({
        user: user._id,

        amount,

        bankDetails: {
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName,
          accountNumber:
            bankAccount.accountNumber,
        },

        status: "pending",
      });

    /*
    IMPORTANT:
    We DO NOT deduct the wallet yet.

    The money remains available until admin approves
    the withdrawal.

    =====================================================
    */

    res.status(201).json({
      status: "success",

      message:
        "Withdrawal request submitted successfully",

      data: withdrawal,
    });
  },
);

/*
=====================================================
GET MY WITHDRAWALS
=====================================================
*/

exports.getMyWithdrawals = catchAsync(
  async (req, res, next) => {
    const withdrawals =
      await Withdrawal.find({
        user: req.user._id,
      }).sort("-createdAt");

    res.status(200).json({
      status: "success",

      results: withdrawals.length,

      data: withdrawals,
    });
  },
);

/*
=====================================================
GET SINGLE WITHDRAWAL
=====================================================
*/

exports.getWithdrawal = catchAsync(
  async (req, res, next) => {
    const withdrawal =
      await Withdrawal.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!withdrawal) {
      return next(
        new AppError(
          "Withdrawal not found",
          404,
        ),
      );
    }

    res.status(200).json({
      status: "success",
      data: withdrawal,
    });
  },
);