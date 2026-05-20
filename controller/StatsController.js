const User = require("../model/UserModel");
const Product = require("../model/ProductModel");
const Order = require("../model/OrderModel");

/*
|--------------------------------------------------------------------------
| GET DASHBOARD STATS
|--------------------------------------------------------------------------
*/
exports.getStats = async (req, res) => {
  try {
    // counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // revenue calculation (FIXED FIELD PATH)
    const revenue = await Order.aggregate([
      {
        $match: {
          "paymentResult.status": "success", // ✅ FIXED
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenue?.[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
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
      success: false,
      message: error.message,
    });
  }
};