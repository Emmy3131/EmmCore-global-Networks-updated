const Withdrawal = require("../model/WithdrawalModel");

const User = require("../model/UserModel");

const WalletTransaction = require("../model/WalletTransanctionModel");

const catchAsync = require("../utils/catchAsync");

const AppError = require("../utils/appError");

/*
=====================================================
CREATE WITHDRAWAL REQUEST
=====================================================
*/

exports.requestWithdrawal = catchAsync(async (req, res, next) => {
  const { amount, bankName, accountName, accountNumber } = req.body;

  const user = await User.findById(req.user._id);

  if (amount <= 0) {
    return next(new AppError("Invalid amount", 400));
  }

  if (user.walletBalance < amount) {
    return next(new AppError("Insufficient wallet balance", 400));
  }

  /*
SAVE BANK DETAILS
*/

  user.bankAccount = {
    bankName,

    accountName,

    accountNumber,
  };

  await user.save();

  const withdrawal = await Withdrawal.create({
    user: user._id,

    amount,

    bankDetails: {
      bankName,
      accountName,
      accountNumber,
    },
  });

  res.status(201).json({
    status: "success",

    data: withdrawal,
  });
});

exports.getMyWithdrawals = catchAsync(async (req, res, next) => {
  const withdrawals = await Withdrawal.find({
    user: req.user._id,
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",

    results: withdrawals.length,

    data: withdrawals,
  });
});

exports.updateWithdrawalStatus = catchAsync(async (req, res, next) => {
  const { status, adminNote } = req.body;

  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    return next(new AppError("Withdrawal not found", 404));
  }

  if (withdrawal.status !== "pending") {
    return next(new AppError("Already processed", 400));
  }

  const user = await User.findById(withdrawal.user);

  /*
=================================
APPROVE
=================================
*/

  if (status === "approved") {
    if (user.walletBalance < withdrawal.amount) {
      return next(new AppError("Insufficient wallet balance", 400));
    }

    const oldBalance = user.walletBalance;

    user.walletBalance -= withdrawal.amount;

    await user.save();

    await WalletTransaction.create({
      user: user._id,

      type: "debit",

      source: "withdrawal",

      title: "Wallet Withdrawal",

      amount: withdrawal.amount,

      balanceBefore: oldBalance,

      balanceAfter: user.walletBalance,
    });
  }

  withdrawal.status = status;

  withdrawal.adminNote = adminNote;

  withdrawal.processedAt = Date.now();

  await withdrawal.save();

  res.status(200).json({
    status: "success",

    data: withdrawal,
  });
});
