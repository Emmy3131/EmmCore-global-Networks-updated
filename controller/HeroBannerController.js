const HeroBannerModel = require("../model/HeroBannerModel");
const AppError = require("../utils/appError");

// ✅ GET Active HERO BANNERS
exports.getHeroBanner = async (req, res) => {
  try {
    const banners = await HeroBannerModel.find({
      active: true,
    }).sort("order");

    res.status(200).json({
      status: "success",
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.createHeroBanner = async (req, res) => {
  try {
    const banner = await HeroBannerModel.create(req.body);

    res.status(201).json({
      status: "success",
      data: banner,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getHeroBanners = async (req, res) => {
  try {
    const banners = await HeroBannerModel.find().sort("order");

    res.status(200).json({
      status: "success",
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateHeroBanner = async (req, res) => {
  try {
    const banner = await HeroBanner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: banner,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteHeroBanner = async (req, res) => {
  try {
    await HeroBanner.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};