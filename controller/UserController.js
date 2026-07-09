const bcrypt = require("bcrypt");
const User = require("../model/UserModel");
const Order = require("../model/OrderModel");

// ✅ GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      status: "success",
      results: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ✅ GET SINGLE USER
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ✅ CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, country, address } =
      req.body;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !country ||
      !address
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      country,
      address,
    });

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        address: newUser.address,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ✅ UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* ===========================================
   UPDATE LOGGED IN USER
=========================================== */

exports.updateMe = catchAsync(async (req, res, next) => {
  // Do not allow password updates here
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updatePassword.",
        400,
      ),
    );
  }

  // Fields that users are allowed to update
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "address",
    "country",
    "dateOfBirth",
    "gender",
  ];

  const filteredBody = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      filteredBody[field] = req.body[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

// ✅ DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all orders for a particular user
exports.getAllOrderByAUser = async (req, res) => {
  try {
    const { id } = req.params;

    const orders = await Order.find({ user: id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* ===============================
   ACTIVATE / DEACTIVATE USER
================================ */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const newStatus = user.status === "active" ? "inactive" : "active";

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      {
        new: true,
        runValidators: false, // IMPORTANT FIX
      },
    );

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
