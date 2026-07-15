const Order = require("../model/OrderModel");
const User = require("../model/UserModel");
const Product = require("../model/ProductModel");

const catchAsync = require("../utils/catchAsync");

/*
=====================================================
REPORT SUMMARY
=====================================================
*/

exports.getReportSummary = catchAsync(async (req, res) => {
  const totalOrders = await Order.countDocuments();

  const totalUsers = await User.countDocuments();

  const sales = await Order.aggregate([
    {
      $match: {
        status: {
          $in: ["paid", "completed", "delivered"],
        },
      },
    },

    {
      $group: {
        _id: null,

        totalRevenue: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);

  const totalRevenue = sales[0]?.totalRevenue || 0;

  const totalProducts = await Product.countDocuments();

  res.status(200).json({
    status: "success",

    data: {
      totalOrders,

      totalUsers,

      totalProducts,

      totalRevenue,
    },
  });
});

/*
=====================================================
MONTHLY SALES CHART
=====================================================
*/

exports.getSalesReport = catchAsync(async (req, res) => {
  const sales = await Order.aggregate([
    {
      $match: {
        status: {
          $in: ["paid", "completed", "delivered"],
        },
      },
    },

    {
      $group: {
        _id: {
          month: {
            $month: "$createdAt",
          },

          year: {
            $year: "$createdAt",
          },
        },

        revenue: {
          $sum: "$totalPrice",
        },

        orders: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formatted = sales.map((item) => ({
    month: months[item._id.month],

    revenue: item.revenue,

    orders: item.orders,
  }));

  res.status(200).json({
    status: "success",

    data: formatted,
  });
});

/*
=====================================================
TOP SELLING PRODUCTS
=====================================================
*/

exports.getTopProducts = catchAsync(async (req, res) => {
  const products = await Order.aggregate([
    {
      $unwind: "$items",
    },

    {
      $group: {
        _id: "$items.product",

        totalSold: {
          $sum: "$items.quantity",
        },
      },
    },

    {
      $sort: {
        totalSold: -1,
      },
    },

    {
      $limit: 10,
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

    data: products,
  });
});

/*
=====================================================
ORDER STATUS REPORT
=====================================================
*/

exports.getOrderStatusReport = catchAsync(async (req, res) => {
  const report = await Order.aggregate([
    {
      $group: {
        _id: "$status",

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",

    data: report,
  });
});


exports.downloadReport = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort("-createdAt");

    let csv =
      "Order ID,Customer,Email,Amount,Payment Status,Order Status,Date\n";

    orders.forEach((order) => {
      csv +=
        `${order._id},` +
        `${order.user?.name || ""},` +
        `${order.user?.email || ""},` +
        `${order.totalPrice},` +
        `${order.paymentStatus},` +
        `${order.orderStatus},` +
        `${order.createdAt.toLocaleDateString()}\n`;
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${Date.now()}.csv`
    );

    res.setHeader("Content-Type", "text/csv");

    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};