const mongoose = require("mongoose");

const vendorSettingSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    message: {
      type: String,
      default: "Vendor marketplace is coming soon",
    },

    title: {
      type: String,
      default: "Vendor Marketplace",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("VendorSetting", vendorSettingSchema);
