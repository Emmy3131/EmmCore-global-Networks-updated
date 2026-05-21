const Cart = require("../model/CartModel");
const Product = require("../model/ProductModel");
const Order = require("../model/OrderModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prepareOrderData = require("../utils/prepareOrderData");

const crypto = require("crypto");

/* ======================================================
   GET ALL ORDERS
====================================================== */
exports.getAllOrders = catchAsync(async (req, res, next) => {

  const orders = await Order.find()
    .populate("user")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: orders,
  });
});

/* ======================================================
   GET SINGLE ORDER
====================================================== */
exports.getOrder = catchAsync(async (req, res, next) => {

  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user");

  if (!order) {
    return next(
      new AppError("Order not found", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: order,
  });
});

/* ======================================================
   CREATE PAYSTACK CHECKOUT SESSION
====================================================== */
exports.getCheckoutSession = catchAsync(async (req, res, next) => {

  const userId = req.user._id;

  /* ================= GET USER CART ================= */

  const cart = await Cart.findOne({
    user: userId,
  });

  if (!cart || cart.items.length === 0) {
    return next(
      new AppError("Cart is empty", 400)
    );
  }

  /* ================= PREPARE ORDER DATA ================= */

  const {
    orderItems,
    totalPrice,
  } = await prepareOrderData(cart);

  /* ================= PAYSTACK PAYLOAD ================= */

  const payload = {
    email: req.user.email,

    amount: totalPrice * 100,

    callback_url:
      `${process.env.FRONTEND_URL}/payment-success`,

    metadata: {
      userId,

      orderItems,

      shippingAddress:
        req.body.shippingAddress,

      totalPrice,
    },
  };

  /* ================= INITIALIZE PAYMENT ================= */

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization:
          `Bearer ${process.env.PAYSTACK_SECRET_KEY_TEST}`,
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {

    console.log(data);

    return next(
      new AppError(
        data.message || "Payment initialization failed",
        500
      )
    );
  }

  /* ================= RESPONSE ================= */

  res.status(200).json({
    status: "success",

    data: {
      authorizationUrl:
        data.data.authorization_url,

      accessCode:
        data.data.access_code,

      reference:
        data.data.reference,
    },
  });
});

/* ======================================================
   PAYSTACK WEBHOOK
====================================================== */
exports.handlePayStackWebhook = catchAsync(async (req, res, next) => {

  /* ================= VERIFY SIGNATURE ================= */

  const hash = crypto
    .createHmac(
      "sha512",
      process.env.PAYSTACK_SECRET_KEY_TEST
    )
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (
    hash !== req.headers["x-paystack-signature"]
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid signature",
    });
  }

  const event = req.body;

  /* ======================================================
     SUCCESSFUL PAYMENT
  ====================================================== */

  if (event.event === "charge.success") {

    const {
      userId,
      orderItems,
      shippingAddress,
      totalPrice,
    } = event.data.metadata;

    const paymentMethod =
      event.data.channel;

    const paymentReference =
      event.data.reference;

    /* ================= CHECK DUPLICATE ORDER ================= */

    const existingOrder =
      await Order.findOne({
        "paymentResult.reference":
          paymentReference,
      });

    if (existingOrder) {
      return res.status(200).json({
        status: "success",
        message:
          "Order already processed",
      });
    }

    /* ================= UPDATE STOCK ================= */

    for (const item of orderItems) {

      const product =
        await Product.findById(
          item.product
        );

      if (!product) {
        throw new AppError(
          "Product not found",
          404
        );
      }

      if (
        product.stock < item.quantity
      ) {
        throw new AppError(
          `${product.name} stock is insufficient`,
          400
        );
      }

      product.stock -= item.quantity;

      await product.save();
    }

    /* ================= CREATE ORDER ================= */

    const order = await Order.create({

      user: userId,

      orderItems,

      shippingAddress,

      paymentMethod,

      paymentStatus: "paid",

      status: "processing",

      isPaid: true,

      paidAt: Date.now(),

      itemsPrice: totalPrice,

      taxPrice: 0,

      shippingPrice: 0,

      totalPrice,

      paymentResult: {
        id: event.data.id,

        reference:
          paymentReference,

        status:
          event.data.status,

        email_address:
          event.data.customer.email,
      },
    });

    /* ================= CLEAR CART ================= */

    await Cart.findOneAndDelete({
      user: userId,
    });

    console.log(
      "ORDER CREATED:",
      order._id
    );

    return res.status(200).json({
      status: "success",
      message:
        "Order processed successfully",
    });
  }

  /* ======================================================
     FAILED PAYMENT
  ====================================================== */

  if (event.event === "charge.failed") {

    return res.status(200).json({
      status: "fail",
      message: "Payment failed",
    });
  }

  /* ======================================================
     DEFAULT RESPONSE
  ====================================================== */

  res.status(200).json({
    status: "success",
  });
});

/* ======================================================
   UPDATE ORDER STATUS
====================================================== */
exports.updateOrderStatus = catchAsync(async (req, res, next) => {

  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return next(
      new AppError("Order not found", 404)
    );
  }

  order.status = req.body.status;

  await order.save();

  res.status(200).json({
    status: "success",
    data: order,
  });
});

/* ======================================================
   DELETE ORDER
====================================================== */
exports.deleteOrder = catchAsync(async (req, res, next) => {

  const { id } = req.params;

  const order =
    await Order.findByIdAndDelete(id);

  if (!order) {
    return next(
      new AppError("Order not found", 404)
    );
  }

  res.status(200).json({
    status: "success",
    message:
      "Order deleted successfully",
  });
});