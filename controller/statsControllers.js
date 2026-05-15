const Stats = require("../model/statsModel");
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
    // count documents
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // calculate revenue
    const revenue = await Order.aggregate([
      {
        $match: { paymentStatus: "paid" }, // adjust to your schema
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenue[0]?.totalRevenue || 0;

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};