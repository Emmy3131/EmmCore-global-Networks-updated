const Product = require("../model/ProductModel");
const AppError = require("./appError");

const prepareOrderData = async (cart) => {
  let totalPrice = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`${product.name} is out of stock`, 400);
    }

    const itemTotal = product.price * item.quantity;
    totalPrice += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    });

    // reduce stock
    // product.stock -= item.quantity;
    // await product.save();
  }

  return {
    orderItems,
    totalPrice,
  };
};

module.exports = prepareOrderData;