const VendorSetting = require("../model/VendorSettingModel");

const catchAsync = require("../utils/catchAsync");

const AppError = require("../utils/appError");

/*
=====================================
GET VENDOR STATUS
PUBLIC
=====================================
*/

exports.getVendorStatus = catchAsync(async (req, res) => {
  let setting = await VendorSetting.findOne();

  if (!setting) {
    setting = await VendorSetting.create({});
  }

  res.status(200).json({
    status: "success",

    data: setting,
  });
});

/*
=====================================
UPDATE VENDOR SETTINGS
ADMIN
=====================================
*/

exports.updateVendorStatus = catchAsync(async (req, res, next) => {
  const { enabled, message, title } = req.body;

  let setting = await VendorSetting.findOne();

  if (!setting) {
    setting = await VendorSetting.create({
      enabled,
      message,
      title,
    });
  } else {
    setting.enabled = enabled;

    setting.message = message;

    setting.title = title;

    await setting.save();
  }

  res.status(200).json({
    status: "success",

    data: setting,
  });
});
