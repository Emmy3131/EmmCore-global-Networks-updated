const Order = require("../model/OrderModel");
const Product = require("../model/ProductModel");
const User = require("../model/UserModel");

const catchAsync = require("../utils/catchAsync");

exports.getReports = catchAsync(async (req, res) => {
  // TOTAL ORDERS
  const totalOrders = await Order.countDocuments();

  // TOTAL USERS
  const totalUsers = await User.countDocuments();

  // TOTAL REVENUE

  const revenue = await Order.aggregate([
    {
      $match: {
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);

  // TOTAL PRODUCTS SOLD

  const sales = await Order.aggregate([
    {
      $unwind: "$items",
    },

    {
      $group: {
        _id: null,
        total: {
          $sum: "$items.quantity",
        },
      },
    },
  ]);

  // MONTHLY SALES

  const monthlySales = await Order.aggregate([
    {
      $match: {
        status: "completed",
      },
    },

    {
      $group: {
        _id: {
          month: {
            $month: "$createdAt",
          },
        },

        sales: {
          $sum: "$totalPrice",
        },
      },
    },

    {
      $sort: {
        "_id.month": 1,
      },
    },
  ]);

  // TOP PRODUCTS

  const topProducts = await Order.aggregate([
    {
      $unwind: "$items",
    },

    {
      $group: {
        _id: "$items.product",

        sold: {
          $sum: "$items.quantity",
        },
      },
    },

    {
      $sort: {
        sold: -1,
      },
    },

    {
      $limit: 5,
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },
  ]);

  res.status(200).json({
    status: "success",

    data: {
      totalOrders,

      totalUsers,

      totalSales: sales[0]?.total || 0,

      totalRevenue: revenue[0]?.total || 0,

      monthlySales,

      topProducts,
    },
  });
});
