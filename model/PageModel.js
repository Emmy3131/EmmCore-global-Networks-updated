const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Page slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Page content is required"],
    },

    metaDescription: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Page", pageSchema);