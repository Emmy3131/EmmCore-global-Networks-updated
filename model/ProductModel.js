const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      unique: true,
      trim: true,
      minlength: 3,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: 10,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    isFlashSale: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    flashSalePrice: {
      type: Number,
      default: 0,
    },

    flashSaleEndAt: Date,

    featured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

productSchema.virtual("discountPercentage").get(function () {
  if (!this.oldPrice || this.oldPrice <= this.price) return 0;

  return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

productSchema.virtual("stockStatus").get(function () {
  if (this.stock === 0) return "Out of Stock";

  if (this.stock < 10) return "Low Stock";

  return "In Stock";
});

productSchema.pre("save", function (next) {
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
  });

  if (!this.sku) {
    const random = Math.floor(100000 + Math.random() * 900000);
    this.sku = `PRD-${random}`;
  }

  next();
});

productSchema.pre("save", function (next) {
  if (this.isFlashSale && this.flashSalePrice >= this.price) {
    return next(
      new Error("Flash sale price must be lower than product price."),
    );
  }

  next();
});

productSchema.index({
  name: "text",
  description: "text",
});

productSchema.index({
  category: 1,
});

productSchema.index({
  isTrending: 1,
});

productSchema.index({
  isFlashSale: 1,
});

productSchema.index({
  featured: 1,
});

module.exports = mongoose.model("Product", productSchema);
