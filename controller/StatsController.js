const User = require("../model/UserModel");
const Product = require("../model/ProductModel");
const Order = require("../model/OrderModel");
const catchAsync = require("../utils/catchAsync");

/*
|--------------------------------------------------------------------------
| GET DASHBOARD STATS
|--------------------------------------------------------------------------
*/
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const revenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid", // FIXED
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenue.length > 0 ? revenue[0].totalRevenue : 0;

    res.status(200).json({
      status: "success",
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("STATS ERROR:", error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getSalesOverview = catchAsync(async (req, res) => {
  const sales = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "Africa/Lagos", // ✅ FIXED (important for Nigeria)
          },
        },
        totalSales: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
      },
    },

    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: sales.length,
    data: sales.map((item) => ({
      date: item._id,          // ✅ cleaner for frontend
      totalSales: item.totalSales,
      totalOrders: item.totalOrders,
    })),
  });
});
