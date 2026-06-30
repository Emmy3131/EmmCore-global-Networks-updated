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
    .populate("user", "firstName lastName email")
    .populate("orderItems.product")
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
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email")
    .populate("orderItems.product");

  if (!order) {
    return next(new AppError("Order not found", 404));
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

  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  const { orderItems, totalPrice } = await prepareOrderData(cart);

  const payload = {
    email: req.user.email,
    amount: totalPrice * 100,
    callback_url: `${process.env.FRONTEND_URL}/payment-success`,
    metadata: {
      userId: userId,
      orderItems: JSON.stringify(orderItems),
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
    },
  );

  const data = await response.json();

  if (!response.ok) {
    return next(
      new AppError(data.message || "Payment initialization failed", 500),
    );
  }

  /* ======================================================
     CREATE PENDING ORDER BEFORE PAYMENT
  ====================================================== */

  await Order.create({
    user: userId,
    orderItems,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: "paystack",
    paymentStatus: "pending",
    orderStatus: "pending",
    itemsPrice: totalPrice,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice,
    paymentResult: {
      reference: data.data.reference,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    },
  });
});

/* ======================================================
   PAYSTACK WEBHOOK (FIXED + SAFE)
====================================================== */
exports.handlePayStackWebhook = async (req, res) => {
  try {
    /* ================= VERIFY SIGNATURE ================= */
    const signature = req.headers["x-paystack-signature"];

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY_TEST)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      return res.sendStatus(401);
    }

    const event = JSON.parse(req.body.toString());

    /* ======================================================
       SUCCESS PAYMENT
    ====================================================== */
    if (event.event === "charge.success") {
     const reference = event.data.reference;

      const order = await Order.findOne({
        "paymentResult.reference": reference,
      });

      if (!order) return res.sendStatus(200);

      // prevent duplicate processing
      if (order.paymentStatus === "paid") {
        return res.sendStatus(200);
      }

      /* ================= UPDATE STOCK ================= */
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);

        if (!product) continue;

        if (product.stock >= item.quantity) {
          product.stock -= item.quantity;
          await product.save();
        }
      }

      /* ================= UPDATE ORDER ================= */
      order.paymentStatus = "paid";
      order.orderStatus = "processing";
      order.isPaid = true;
      order.paidAt = Date.now();

      order.paymentResult = {
        id: event.data.id,
        reference: reference,
        status: event.data.status,
        email_address: event.data.customer.email,
      };

      await order.save();

      /* ================= CLEAR CART ================= */
      await Cart.findOneAndDelete({ user: order.user });

      return res.sendStatus(200);
    }

    /* ======================================================
       FAILED PAYMENT
    ====================================================== */
    if (event.event === "charge.failed") {
      const reference = event.data.reference;

      const order = await Order.findOne({
        "paymentResult.reference": reference,
      });

      if (order) {
        order.paymentStatus = "failed";
        await order.save();
      }

      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(200);
  }
};

/* ======================================================
   VERIFY PAYMENT (MANUAL BACKUP)
====================================================== */
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { reference } = req.query;

  if (!reference) {
    return next(new AppError("Payment reference missing", 400));
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY_TEST}`,
      },
    },
  );

  const data = await response.json();

  if (!data.status) {
    return next(new AppError("Payment verification failed", 400));
  }

  res.status(200).json({
    status: "success",
    data: data.data,
  });
});

/* ======================================================
   UPDATE ORDER STATUS (ADMIN)
====================================================== */
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.orderStatus = req.body.orderStatus;

  if (req.body.orderStatus === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  if (req.body.orderStatus === "cancelled") {
    order.isDelivered = false;
  }

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
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Order deleted successfully",
  });
});

/* ======================================================
   GET MY ORDERS
====================================================== */
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("orderItems.product")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: orders,
  });
});
