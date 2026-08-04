const Referral = require("../model/RefferalModel");
const User = require("../model/UserModel");

const { referralBonus, minimumOrderAmount } = require("../utils/referral");
const WalletTransaction = require("../model/WalletTransanctionModel");

/*
==================================================
 CREATE REFERRAL AFTER USER SIGNUP
==================================================
*/

exports.createReferral = async ({ referralCode, newUserId }) => {
  // No referral code provided
  if (!referralCode) {
    return null;
  }

  // Find owner of referral code
  const referrer = await User.findOne({
    referralCode,
  });

  // Invalid referral code
  if (!referrer) {
    return null;
  }

  // Prevent self referral
  if (referrer._id.toString() === newUserId.toString()) {
    return null;
  }

  // Check duplicate referral
  const existingReferral = await Referral.findOne({
    referrer: referrer._id,
    referredUser: newUserId,
  });

  if (existingReferral) {
    return existingReferral;
  }

  const referral = await Referral.create({
    referrer: referrer._id,

    referredUser: newUserId,

    referralCode,

    status: "pending",

    rewardAmount: referralBonus,
  });

  return referral;
};

/*
==================================================
 QUALIFY REFERRAL AFTER FIRST ORDER
==================================================
*/

exports.qualifyReferral = async ({ userId, orderId, orderAmount }) => {
  // Check minimum order requirement
  if (orderAmount < minimumOrderAmount) {
    return null;
  }

  // Find pending referral
  const referral = await Referral.findOne({
    referredUser: userId,
    status: "pending",
  });

  if (!referral) {
    return null;
  }

  referral.status = "qualified";

  referral.qualifyingOrder = orderId;

  await referral.save();

  return referral;
};

/*
==================================================
 PAY REFERRAL BONUS
==================================================
*/

exports.rewardReferral = async ({ referralId }) => {
  const referral = await Referral.findById(referralId);

  if (!referral) {
    return null;
  }

  if (referral.status === "rewarded") {
    return referral;
  }

  const user = await User.findById(referral.referrer);

  if (!user) {
    return null;
  }

  const oldBalance = user.walletBalance || 0;

  const newBalance = oldBalance + referral.rewardAmount;

  /*
=====================================
UPDATE USER WALLET
=====================================
*/

  user.walletBalance = newBalance;

  await user.save();

  /*
=====================================
CREATE TRANSACTION RECORD
=====================================
*/

  await WalletTransaction.create({
    user: user._id,

    type: "credit",

    source: "referral",

    title: "Referral Bonus",

    amount: referral.rewardAmount,

    balanceBefore: oldBalance,

    balanceAfter: newBalance,

    reference: `REF-${referral._id}`,
  });

  /*
=====================================
UPDATE REFERRAL STATUS
=====================================
*/

  referral.status = "rewarded";

  referral.rewardedAt = Date.now();

  await referral.save();

  return referral;
};

/*
==================================================
 GET USER REFERRAL STATS
==================================================
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

exports.processOrderReferral = async ({ userId, orderId, orderAmount }) => {
  /*
  Find pending referral
  */

  const referral = await Referral.findOne({
    referredUser: userId,
    status: "pending",
  });

  if (!referral) {
    return null;
  }

  /*
  Check minimum order amount
  */

  if (orderAmount < minimumOrderAmount) {
    return null;
  }

  /*
  Mark referral qualified
  */

  referral.status = "qualified";

  referral.qualifyingOrder = orderId;

  await referral.save();

  /*
  Pay reward
  */

  await exports.rewardReferral({
    referralId: referral._id,
  });

  return referral;
};
