const Category = require("../model/Category");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ===============================
// CREATE CATEGORY
// ===============================
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, image } = req.body;
  console.log("BODY", req.body)

  if(!name){
    return next(new AppError("Category name is required", 400));
  }
  const category = await Category.create({ name, description, image });

  res.status(201).json({
    status: "success",
    data: category,
  });
});

// ===============================
// GET ALL CATEGORIES
// ===============================
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();
    res.status(200).json({
    status: "success",
    results: categories.length,
    data: categories,
  });
});

// ===============================
// GET CATEGORY BY ID
// ===============================
exports.getCategoryById = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: category,
  });
});

// ===============================
// UPDATE CATEGORY
// ===============================
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, description, image } = req.body;
    const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description, image },
    { new: true, runValidators: true }
  );
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: category,
  });
});

// ===============================
// DELETE CATEGORY
// ===============================
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
    return next(new AppError("Category not found", 404));
  }
    res.status(204).json({
    status: "success",
    data: null,
  });
});
