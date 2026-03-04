const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User reference is required"]
  },

  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, "Product reference is required"]
      },

      name: {
        type: String,
        required: true
      },

      price: {
        type: Number,
        required: true
      },

      quantity: {
        type: Number,
        required: [true, "Product quantity is required"],
        min: [1, "Quantity must be at least 1"]
      }
    }
  ],

  subtotal: {
    type: Number,
    required: true
  },

  tax: {
    type: Number,
    required: true
  },

  discount: {
    type: Number,
    default: 0
  },

  totalPrice: {
    type: Number,
    required: [true, "Total price is required"]
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },

  isDelivered: {
    type: Boolean,
    default: false
  },

  deliveredAt: Date

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);