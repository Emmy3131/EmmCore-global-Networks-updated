const PageModel = require("../models/PageModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createPage = catchAsync(async (req, res, next) => {
  const existingPage = await PageModel.findOne({
    slug: req.body.slug,
  });

  if (existingPage) {
    return next(
      new AppError("A page with this slug already exists", 400)
    );
  }

  const page = await PageModel.create(req.body);

  res.status(201).json({
    status: "success",
    data: page,
  });
});

exports.getPages = catchAsync(async (req, res) => {
  const pages = await PageModel.find().sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: pages.length,
    data: pages,
  });
});


exports.getPublishedPages = catchAsync(async (req, res) => {
  const pages = await PageModel.find({
    status: "published",
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: pages.length,
    data: pages,
  });
});



exports.getPageBySlug = catchAsync(async (req, res, next) => {
  const page = await PageModel.findOne({
    slug: req.params.slug,
  });

  if (!page) {
    return next(
      new AppError("Page not found", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: page,
  });
});

exports.getPageById = catchAsync(async (req, res, next) => {
  const page = await PageModel.findById(
    req.params.id
  );

  if (!page) {
    return next(
      new AppError("Page not found", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: page,
  });
});

exports.updatePage = catchAsync(async (req, res, next) => {
  const updatedPage =
    await PageModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedPage) {
    return next(
      new AppError("Page not found", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: updatedPage,
  });
});

exports.deletePage = catchAsync(async (req, res, next) => {
  const deletedPage =
    await PageModel.findByIdAndDelete(
      req.params.id
    );

  if (!deletedPage) {
    return next(
      new AppError("Page not found", 404)
    );
  }

  res.status(200).json({
    status: "success",
    message: "Page deleted successfully",
  });
});
