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
const statsRoutes = require("./routes/statsRoutes");
const newsletterRoutes = require("./routes/NewsletterSubRoutes");

const AppError = require("./utils/appError");
const globalErrorController = require("./controller/GlobalErrorController");

const app = express();

app.set('trust proxy', 1);

/* ======================
   ✅ CORS FIRST
====================== */

const allowedOrigins = [
  "http://localhost:5173",
  "https://emm-core-shops.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow REST tools like Postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS request from:", origin);

      return callback(null, false); // ❌ don't crash server
    },
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
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
/* ======================
   404 HANDLER
====================== */
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

/* ======================
   GLOBAL ERROR
====================== */
app.use(globalErrorController);

module.exports = app;