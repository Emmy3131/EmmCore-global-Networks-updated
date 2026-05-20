const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../model/UserModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/*
|--------------------------------------------------------------------------
| SIGN TOKEN
|--------------------------------------------------------------------------
*/
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/*
|--------------------------------------------------------------------------
| SEND TOKEN + COOKIE
|--------------------------------------------------------------------------
*/
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,        // production HTTPS
    sameSite: "none",    // ⭐ REQUIRED FOR VERCEL
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Provide email and password", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({ status: "success" });
};

/*
|--------------------------------------------------------------------------
| PROTECT ROUTE
|--------------------------------------------------------------------------
*/
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // header token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // cookie token
  if (!token && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError("You are not logged in! Please login.", 401)
    );

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(new AppError("User no longer exists", 401));

  req.user = currentUser;
  next();
});

/*
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Not authorized", 403));
    }
    next();
  };
};