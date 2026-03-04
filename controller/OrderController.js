const Product = require('../models/ProductModel');

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Products are required"
      });
    }

    let orderItems = [];
    let subtotal = 0;

    for (const item of products) {
      const productData = await Product.findById(item.product);

      if (!productData) {
        return res.status(404).json({
          status: "error",
          message: "Product not found"
        });
      }

      subtotal += productData.price * item.quantity;

      orderItems.push({
        product: productData._id,
        name: productData.name,
        price: productData.price,
        quantity: item.quantity
      });
    }

    const tax = subtotal * 0.075;
    const totalPrice = subtotal + tax;

    const newOrder = await orderModel.create({
      user: userId,
      products: orderItems,
      subtotal,
      tax,
      totalPrice
    });

    res.status(201).json({
      status: "success",
      data: newOrder
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};