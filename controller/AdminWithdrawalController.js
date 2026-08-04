const Withdrawal = require("../model/WithdrawalModel");

const catchAsync = require("../utils/catchAsync");

/*
=====================================================
GET ALL WITHDRAWALS
=====================================================
*/

exports.getAllWithdrawals = catchAsync(async (req, res, next) => {
  const withdrawals = await Withdrawal.find()

    .populate("user", "firstName lastName email walletBalance")

    .sort("-createdAt");

  res.status(200).json({
    status: "success",

    results: withdrawals.length,

    data: withdrawals,
  });
});
