const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  name: String,
  image: String,

  quantity: {
    type: Number,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    // 👤 User who made order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🛒 Ordered products
    orderItems: [orderItemSchema],

    // 🚚 Shipping Address
    shippingAddress: {
      address: String,
      city: String,
      state: String,
      phone: String, 
    },

    // 💳 Payment
    paymentMethod: {
      type: String,
      //enum: ["card", "bank_transfer", "cash_on_delivery"],
      required: true,
    },

    paymentResult: {
      id: String,
      status: String,
      email_address: String,
    },

    // 💰 Prices
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // 📦 Order Status
    orderStatus: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: Date,

    isDelivered: {
      type: Boolean,
      default: false,
    },

    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);