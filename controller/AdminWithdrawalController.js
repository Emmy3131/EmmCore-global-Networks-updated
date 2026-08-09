const Withdrawal = require("../model/WithdrawalModel");

const catchAsync = require("../utils/catchAsync");

/*
=====================================================
GET ALL WITHDRAWALS
=====================================================
*/

/*
=====================================================
ADMIN GET ALL WITHDRAWALS
=====================================================
*/

exports.getAllWithdrawals = catchAsync(async (req, res, next) => {
  const withdrawals = await Withdrawal.find()
    .populate("user", "firstName lastName email phone walletBalance")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: withdrawals.length,
    data: withdrawals,
  });
});

/*
=====================================================
ADMIN APPROVE WITHDRAWAL
=====================================================
*/

exports.approveWithdrawal = catchAsync(async (req, res, next) => {
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    return next(new AppError("Withdrawal not found", 404));
  }

  /*
    =====================================================
    ONLY PENDING WITHDRAWALS CAN BE APPROVED
    =====================================================
    */

  if (withdrawal.status !== "pending") {
    return next(
      new AppError(`Withdrawal is already ${withdrawal.status}`, 400),
    );
  }

  /*
    =====================================================
    GET USER
    =====================================================
    */

  const user = await User.findById(withdrawal.user).select("_id walletBalance");

  if (!user) {
    return next(new AppError("User associated with withdrawal not found", 404));
  }

  const currentBalance = user.walletBalance || 0;

  /*
    =====================================================
    CHECK BALANCE AGAIN
    =====================================================

    IMPORTANT:

    We check the balance again because the balance may
    have changed after the withdrawal was requested.
    */

  if (currentBalance < withdrawal.amount) {
    return next(new AppError("User does not have enough wallet balance", 400));
  }

  /*
    =====================================================
    PREVENT DUPLICATE TRANSACTION
    =====================================================
    */

  const transactionReference = `WITHDRAWAL-${withdrawal._id}`;

  const existingTransaction = await WalletTransaction.findOne({
    user: user._id,
    source: "withdrawal",
    reference: transactionReference,
  });

  if (existingTransaction) {
    return next(
      new AppError("This withdrawal has already been processed", 400),
    );
  }

  /*
    =====================================================
    CALCULATE BALANCE
    =====================================================
    */

  const balanceBefore = currentBalance;

  const balanceAfter = balanceBefore - withdrawal.amount;

  /*
    =====================================================
    DEDUCT WALLET
    =====================================================

    Use findByIdAndUpdate instead of user.save()
    to avoid passwordConfirm validation.
    */

  await User.findByIdAndUpdate(
    user._id,
    {
      $inc: {
        walletBalance: -withdrawal.amount,
      },
    },
    {
      new: true,
      runValidators: false,
    },
  );

  /*
    =====================================================
    CREATE WALLET TRANSACTION
    =====================================================
    */

  await WalletTransaction.create({
    user: user._id,

    type: "debit",

    source: "withdrawal",

    title: "Wallet Withdrawal",

    amount: withdrawal.amount,

    balanceBefore,

    balanceAfter,

    reference: transactionReference,

    status: "completed",
  });

  /*
    =====================================================
    UPDATE WITHDRAWAL
    =====================================================
    */

  withdrawal.status = "approved";

  withdrawal.processedAt = new Date();

  await withdrawal.save();

  /*
    =====================================================
    RESPONSE
    =====================================================
    */

  res.status(200).json({
    status: "success",

    message: "Withdrawal approved and wallet balance deducted",

    data: withdrawal,
  });
});

/*
=====================================================
ADMIN REJECT WITHDRAWAL
=====================================================
*/

exports.rejectWithdrawal = catchAsync(async (req, res, next) => {
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    return next(new AppError("Withdrawal not found", 404));
  }

  /*
    =====================================================
    ONLY PENDING WITHDRAWALS CAN BE REJECTED
    =====================================================
    */

  if (withdrawal.status !== "pending") {
    return next(
      new AppError(`Withdrawal is already ${withdrawal.status}`, 400),
    );
  }

  /*
    =====================================================
    ADMIN NOTE
    =====================================================
    */

  const adminNote = req.body.adminNote?.trim();

  if (!adminNote) {
    return next(
      new AppError("Please provide a reason for rejecting the withdrawal", 400),
    );
  }

  /*
    =====================================================
    UPDATE WITHDRAWAL
    =====================================================
    */

  withdrawal.status = "rejected";

  withdrawal.adminNote = adminNote;

  withdrawal.processedAt = new Date();

  await withdrawal.save();

  /*
    =====================================================
    RESPONSE
    =====================================================
    */

  res.status(200).json({
    status: "success",

    message: "Withdrawal rejected successfully",

    data: withdrawal,
  });
});

/*
=====================================================
ADMIN MARK WITHDRAWAL AS PAID
=====================================================
*/

exports.markWithdrawalPaid = catchAsync(async (req, res, next) => {
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    return next(new AppError("Withdrawal not found", 404));
  }

  /*
      =====================================================
      ONLY APPROVED WITHDRAWALS CAN BE MARKED PAID
      =====================================================
      */

  if (withdrawal.status !== "approved") {
    return next(
      new AppError("Only approved withdrawals can be marked as paid", 400),
    );
  }

  /*
      =====================================================
      UPDATE STATUS
      =====================================================
      */

  withdrawal.status = "paid";

  withdrawal.processedAt = new Date();

  await withdrawal.save();

  res.status(200).json({
    status: "success",

    message: "Withdrawal marked as paid",

    data: withdrawal,
  });
});
