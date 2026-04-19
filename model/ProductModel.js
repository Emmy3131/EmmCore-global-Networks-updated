const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Product image URL is required"],
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      unique:true,
      minlength: [3, "Product name must be at least 3 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [10, "Description must be at least 10 characters"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
      trim: true,
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// productSchema.index({ name: 1 });

productSchema.virtual("totalPrice").get(function () {
  return this.price * this.stock; //
});

productSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  
});

module.exports = mongoose.model("Product", productSchema);
