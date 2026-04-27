const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");

const userRoutes = require("./routes/UserRoutes");
const productRoutes = require("./routes/ProductRouter");
const orderRouter = require("./routes/orderRoutes");
const cartRouter = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/CategoryRoutes");

const AppError = require("./utils/appError");
const globalErrorController = require("./controller/GlobalErrorController");

const app = express();

/* ======================
   ✅ CORS FIRST
====================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://emm-core-global-networks-updated.vercel.app",
    ],
    credentials: true,
  })
);

/* ======================
   SECURITY
====================== */
app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);
app.use(hpp());

/* ======================
   BODY PARSER
====================== */
app.use(express.json());

app.set("query parser", "extended");

/* ======================
   ROUTES
====================== */
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/categories", categoryRoutes);

/* ======================
   404 HANDLER
====================== */
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

/* ======================
   GLOBAL ERROR
====================== */
app.use(globalErrorController);

module.exports = app;