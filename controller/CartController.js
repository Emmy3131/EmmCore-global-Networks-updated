const Cart = require("../model/CartModel");
const Product = require("../model/ProductModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");


// ===============================
// HELPER → CALCULATE CART TOTALS
// ===============================
const calculateCartTotals = (cart) => {
  cart.totalItems = 0;
  cart.totalPrice = 0;

  cart.items.forEach(item => {
    cart.totalItems += item.quantity;
    cart.totalPrice += item.quantity * item.price;
  });
};


// ===============================
// ADD TO CART
// ===============================
exports.addToCart = catchAsync(async (req, res, next) => {

  const { productId, quantity = 1 } = req.body;
  const userId = req.user._id;

  if (!productId || quantity < 1) {
    return next(new AppError("Product and val id quantity required", 400));
  }

  // Check product
  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError("Product not found", 404));
 
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: []
    });
  }

  // Check existing item
  const existingItem = cart.items.find(
    item => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity
    });
  }

  calculateCartTotals(cart);

  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Product added to cart",
    data: cart
  });
});

// ===============================
// GET CART
// ===============================
exports.getCart = catchAsync(async (req, res, next) => {

  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product");

  if (!cart) {
    return next(new AppError("Cart is empty", 404));
  }

  res.status(200).json({
    status: "success",
    data: cart
  });
});

// ===============================
// Update CART
// ===============================
exports.updateCartItem = catchAsync(async (req, res, next) => {

  const { productId, quantity } = req.body;

  if (!productId || quantity < 1) {
    return next(new AppError("Invalid quantity", 400));
  }

  const cart = await Cart.findById(req.params.id);

  if (!cart) return next(new AppError("Cart not found", 404));

  const item = cart.items.find(
    item => item.product.toString() === productId
  );

  if (!item) {
    return next(new AppError("Item not in cart", 404));
  }

  item.quantity+= quantity;

  calculateCartTotals(cart);

  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Cart updated",
    data: cart
  });
});

// ===============================
// Remove from CART
// ===============================
exports.removeFromCart = catchAsync(async (req, res, next) => {

  const { productId } = req.body;

 const cart = await Cart.findById(req.params.id);

  if (!cart) return next(new AppError("Cart not found", 404));

  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );

  calculateCartTotals(cart);

  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Item removed",
    data: cart
  });
});

// ===============================
// Clear CART
// ===============================
exports.clearCart = catchAsync(async (req, res, next) => {

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return next(new AppError("Cart not found", 404));

  cart.items = [];
  cart.totalItems = 0;
  cart.totalPrice = 0;

  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Cart cleared"
  });
});