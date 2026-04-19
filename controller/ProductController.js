const Product = require('../model/ProductModel')
const ApiFeatures = require('../utils/ApiFeatures')
const catchAsync = require ("../utils/catchAsync")
const AppError = require('../utils/appError')


// ✅ GET ALL PRODUCTS

exports.getProducts = catchAsync(async (req, res, next) => {

  const features = new ApiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products
  });

});


    

// ✅ GET SINGLE PRODUCT
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: product
  });
});
     

// ✅ CREATE PRODUCT
exports.createProduct = catchAsync(async (req, res, next) => {
  
  const { image, name, description, price, category, stock } = req.body

    const newProduct = new Product({
      image,
      name,
      description,
      price,
      category,
      stock
    })

    const savedProduct = await newProduct.save()
    res.status(201).json({
      status: "success",
      data: savedProduct
    })
  }
)

// ✅ UPDATE PRODUCT
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params
    const updates = req.body
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true })

    if (!updatedProduct) {
      return next(new AppError("Product not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: updatedProduct
    })
  } )

// ✅ DELETE PRODUCT
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params

    const deletedProduct = await Product.findByIdAndDelete(id)
    if (!deletedProduct) {
      return next(new AppError("Product not found", 404));
    }
    res.status(200).json({
      status: "success",
      message: "Product deleted successfully"
    })
    } )