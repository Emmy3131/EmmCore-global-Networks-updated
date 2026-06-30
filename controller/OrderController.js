const Cart = require("../model/CartModel");
const Product = require("../model/ProductModel");
const Order = require("../model/OrderModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prepareOrderData = require("../utils/prepareOrderData");
const Email = require("../utils/email");

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
      orderItems: orderItems,
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
    const signature = req.headers["x-paystack-signature"];

    const rawBody = req.body; // MUST be Buffer (from express.raw)

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY_TEST)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return res.sendStatus(401);
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      const order = await Order.findOne({
        "paymentResult.reference": reference,
      });

      if (!order) {
        console.log("Order not found:", reference);
        return res.sendStatus(200);
      }

      // prevent double processing
      if (order.paymentStatus === "paid") {
        return res.sendStatus(200);
      }

      // update order FIRST
      order.paymentStatus = "paid";
      order.orderStatus = "processing";
      order.isPaid = true;
      order.paidAt = Date.now();

      await order.save();

      // update stock
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);

        if (product && product.stock >= item.quantity) {
          product.stock -= item.quantity;
          await product.save();
        }
      }

      // FIXED CART CLEARING (IMPORTANT)
      await Cart.deleteMany({ user: order.user });

      console.log("CART CLEARED FOR USER:", order.user);

      return res.sendStatus(200);
    }

    if (event.event === "charge.failed") {
      const reference = event.data.reference;

      await Order.findOneAndUpdate(
        { "paymentResult.reference": reference },
        { paymentStatus: "failed" },
      );

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
  const order = await Order.findById(req.params.id).populate(
    "user",
    "firstName lastName email",
  );

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

  /* ================= EMAIL MESSAGE ================= */

  let subject = "";
  let message = "";

  switch (order.orderStatus) {
    case "processing":
      subject = "Your Order is Being Processed";
      message = `
Hello ${order.user.firstName},

Great news! 🎉

We've started preparing your order.

Order ID: ${order._id}

Current Status: Processing

We'll notify you again once your order has been shipped.

Thank you for shopping with us.
`;
      break;

    case "shipped":
      subject = "Your Order Has Been Shipped";
      message = `
Hello ${order.user.firstName},

Your order has been shipped and is on its way.

Order ID: ${order._id}

Current Status: Shipped

Please keep an eye on your phone and email for delivery updates.

Thank you for shopping with us.
`;
      break;

    case "delivered":
      subject = "Order Delivered";
      message = `
Hello ${order.user.firstName},

Your order has been delivered successfully.

Order ID: ${order._id}

We hope you enjoy your purchase.

Thank you for choosing our store. ❤️
`;
      break;

    case "cancelled":
      subject = "Order Cancelled";
      message = `
Hello ${order.user.firstName},

Your order has been cancelled.

Order ID: ${order._id}

If you did not request this cancellation, please contact our support team.

Thank you.
`;
      break;

    default:
      subject = "Order Updated";
      message = `
Hello ${order.user.firstName},

Your order status has been updated.

Current Status: ${order.orderStatus}

Order ID: ${order._id}

Thank you for shopping with us.
`;
  }

  /* ================= SEND EMAIL ================= */

  try {
  const email = new Email(order.user);

  await email.send(subject, message);

  console.log("Order status email sent.");
} catch (err) {
  console.error("Email sending failed:", err);
}

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
