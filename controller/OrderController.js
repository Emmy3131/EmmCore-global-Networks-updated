const Cart = require("../model/CartModel");
const Product = require("../model/ProductModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const orderModel = require("../model/OrderModel");
const prepareOrderData = require("../utils/prepareOrderData");
const crypto = require("crypto");

// GET ALL ORDERS
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await orderModel.find();

  if (orders.length === 0) {
    return next(new AppError("No orders found", 404));
  }

  res.status(200).json({
    status: "success",
    data: orders,
  });
});

// GET SINGLE ORDER
exports.getOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const order = await orderModel.findById(id);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: order,
  });
});

//CREATE CHECKOUT SESSION
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  const { orderItems, totalPrice } = await prepareOrderData(cart);

  const payload = {
    email: req.user.email,
    amount: totalPrice * 100,

    /* ✅ FRONTEND REDIRECT */
    callback_url: `${process.env.FRONTEND_URL}/payment-success`,

    metadata: {
      userId,
      orderItems,
      shippingAddress: req.body.shippingAddress,
      totalPrice,
    },
  };

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY_TEST}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return next(new AppError("Payment initialization failed", 500));
  }

  res.status(200).json({
    status: "success",
    data: {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    },
  });
});

// CREATE ORDER

exports.handlePayStackWebhook = catchAsync(async (req, res, next) => {
  /* ===============================
     1️⃣ VERIFY PAYSTACK SIGNATURE
  =============================== */
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY_TEST)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid signature" });
  }

  res.status(200).json({ received: true });
  const event = req.body;

  /* ===============================
     2️⃣ HANDLE SUCCESSFUL PAYMENT
  =============================== */
  if (event.event === "charge.success") {
    const { userId, orderItems, shippingAddress, totalPrice } =
      event.data.metadata;

    const paymentMethod = event.data.channel;
    const paymentReference = event.data.reference;

    /* ===============================
       3️⃣ PREVENT DUPLICATE ORDERS
    =============================== */
    const existingOrder = await Order.findOne({
      "paymentResult.reference": paymentReference,
    });

    if (existingOrder) {
      return res.status(200).json({
        status: "success",
        message: "Order already processed",
      });
    }

    /* ===============================
       4️⃣ REDUCE PRODUCT STOCK
    =============================== */
    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`${product.name} stock is insufficient`, 400);
      }

      product.stock -= item.quantity;
      await product.save();
    }

    /* ===============================
       5️⃣ CREATE ORDER
    =============================== */
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: totalPrice,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice,

      paymentResult: {
        id: event.data.id,
        reference: paymentReference,
        status: event.data.status,
        email_address: event.data.customer.email,
      },
    });

    /* ===============================
       6️⃣ UPDATE CUSTOMER RECORD
    =============================== */
    // await User.findByIdAndUpdate(userId, {
    //   $push: { orders: order._id },
    //   $inc: { totalOrders: 1 },
    // });

    /* ===============================
       7️⃣ CLEAR USER CART
    =============================== */
    await Cart.findOneAndDelete({ user: userId });

    /* ===============================
       8️⃣ RESPOND TO PAYSTACK
    =============================== */
    return res.status(200).json({
      status: "success",
      message: "Order processed successfully",
    });
  }
});

// DELETE ORDER
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await orderModel.findByIdAndDelete(id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: order,
  });
});
