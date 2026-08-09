const Referral = require("../model/RefferalModel");
const User = require("../model/UserModel");
const WalletTransaction = require("../model/WalletTransanctionModel");

const { referralBonus, minimumOrderAmount } = require("../utils/referral");

/*
=====================================================
CREATE REFERRAL AFTER USER SIGNUP
=====================================================
*/

exports.createReferral = async ({ referralCode, newUserId }) => {
  if (!referralCode) {
    return null;
  }

  const normalizedCode = referralCode.trim().toUpperCase();

  /*
  =====================================================
  FIND REFERRER
  =====================================================
  */

  const referrer = await User.findOne({
    referralCode: normalizedCode,
  });

  if (!referrer) {
    return null;
  }

  /*
  =====================================================
  PREVENT SELF REFERRAL
  =====================================================
  */

  if (referrer._id.toString() === newUserId.toString()) {
    return null;
  }

  /*
  =====================================================
  CHECK DUPLICATE
  =====================================================
  */

  const existingReferral = await Referral.findOne({
    referrer: referrer._id,
    referredUser: newUserId,
  });

  if (existingReferral) {
    return existingReferral;
  }

  /*
  =====================================================
  CREATE REFERRAL
  =====================================================
  */

  const referral = await Referral.create({
    referrer: referrer._id,

    referredUser: newUserId,

    referralCode: normalizedCode,

    status: "pending",

    rewardAmount: referralBonus,
  });

  console.log(`Referral created: ${referrer._id} referred ${newUserId}`);

  return referral;
};

/*
=====================================================
PROCESS REFERRAL AFTER SUCCESSFUL PAYMENT
=====================================================

This is the main function that should be called
after a successful qualifying payment.
=====================================================
*/

exports.processOrderReferral = async ({ userId, orderId, orderAmount }) => {
  /*
  =====================================================
  CHECK MINIMUM ORDER
  =====================================================
  */

  if (orderAmount < minimumOrderAmount) {
    console.log(`Order ${orderId} does not qualify for referral bonus.`);

    return null;
  }

  /*
  =====================================================
  FIND PENDING REFERRAL
  =====================================================
  */

  const referral = await Referral.findOne({
    referredUser: userId,
    status: "pending",
  });

  if (!referral) {
    console.log(`No pending referral found for user ${userId}`);

    return null;
  }

  /*
  =====================================================
  FIND REFERRER
  =====================================================
  */

  const referrer = await User.findById(referral.referrer);

  if (!referrer) {
    console.error(`Referrer not found: ${referral.referrer}`);

    return null;
  }

  /*
  =====================================================
  CHECK IF BONUS WAS ALREADY PAID
  =====================================================
  */

  const existingTransaction = await WalletTransaction.findOne({
    user: referrer._id,
    source: "referral",
    reference: `REF-${referral._id}`,
  });

  if (existingTransaction) {
    /*
    Make sure referral status is synchronized.
    */

    referral.status = "rewarded";

    referral.qualifyingOrder = orderId;

    referral.rewardedAt = referral.rewardedAt || new Date();

    await referral.save();

    return referral;
  }

  /*
  =====================================================
  WALLET BALANCE
  =====================================================
  */

  const balanceBefore = referrer.walletBalance || 0;

  const balanceAfter = balanceBefore + referral.rewardAmount;

  /*
  =====================================================
  CREDIT WALLET
  =====================================================
  */

  referrer.walletBalance = balanceAfter;

  await referrer.save();

  /*
  =====================================================
  CREATE WALLET TRANSACTION
  =====================================================
  */

  await WalletTransaction.create({
    user: referrer._id,

    type: "credit",

    source: "referral",

    title: "Referral Bonus",

    amount: referral.rewardAmount,

    balanceBefore,

    balanceAfter,

    reference: `REF-${referral._id}`,

    status: "completed",
  });

  /*
  =====================================================
  UPDATE REFERRAL
  =====================================================
  */

  referral.status = "rewarded";

  referral.qualifyingOrder = orderId;

  referral.rewardedAt = new Date();

  await referral.save();

  console.log(
    `Referral bonus ₦${referral.rewardAmount} credited to ${referrer._id}`,
  );

  return referral;
};

/*
=====================================================
GET USER REFERRAL STATS
=====================================================
*/

exports.getReferralStats = async (userId) => {
  const referrals = await Referral.find({
    referrer: userId,
  });

  const total = referrals.length;

  const successful = referrals.filter(
    (item) => item.status === "rewarded",
  ).length;

  const pending = referrals.filter((item) => item.status === "pending").length;

  const bonus = referrals
    .filter((item) => item.status === "rewarded")
    .reduce((sum, item) => sum + item.rewardAmount, 0);

  return {
    total,
    successful,
    pending,
    bonus,
    referrals,
  };
};
