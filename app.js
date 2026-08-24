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
const heroBannerRoutes = require("./routes/HeroBannerRoutes");
const pageRoutes = require("./routes/pageRoutes");
const reportRouter = require("./routes/ReportRoutes");
const vendorRoutes = require("./routes/VendorRoutes");
const reviewRoutes = require("./routes/ReviewRoutes");
const wishListRoutes = require("./routes/WishListRoutes");
const referralRoutes = require("./routes/ReferralRoutes");
const walletRoutes = require("./routes/WalletRoute");
const withdrawalRoutes = require("./routes/WithrawalRoutes");
const adminReferralRoutes = require("./routes/AdminRoutes");

const AppError = require("./utils/appError");
const globalErrorController = require("./controller/GlobalErrorController");

const app = express();

app.set("trust proxy", 1);

/* =====================================================
   CORS
===================================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "https://emm-core-shops.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without Origin.
    // This includes Postman, curl and server-to-server requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);

    // Do not crash the application because of CORS.
    return callback(null, false);
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/*
 * Explicitly handle OPTIONS requests.
 *
 * This is important for browser preflight requests.
 */
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

/* =====================================================
   SECURITY
===================================================== */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again in an hour",
  },
});

app.use("/api", limiter);

app.use(hpp());

/* =====================================================
   PAYSTACK WEBHOOK
   MUST COME BEFORE express.json()
===================================================== */

app.use(
  "/api/v1/orders/webhook",
  express.raw({
    type: "application/json",
  })
);

/* =====================================================
   BODY PARSER
===================================================== */

app.use(express.json());

app.set("query parser", "extended");

/* =====================================================
   ROOT / HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "EmmCore Global Networks API is running",
  });
});

/* =====================================================
   API ROUTES
===================================================== */

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/products", productRoutes);

app.use("/api/v1/reports", reportRouter);

app.use("/api/v1/orders", orderRouter);

app.use("/api/v1/referrals", referralRoutes);

app.use("/api/v1/wallet", walletRoutes);

app.use("/api/v1/cart", cartRouter);

app.use("/api/v1/categories", categoryRoutes);

app.use("/api/v1/stats", statsRoutes);

app.use("/api/v1/newsletter", newsletterRoutes);

app.use("/api/v1/hero-banners", heroBannerRoutes);

app.use("/api/v1/pages", pageRoutes);

app.use("/api/v1/vendors", vendorRoutes);

app.use("/api/v1/reviews", reviewRoutes);

app.use("/api/v1/wishlist", wishListRoutes);

app.use("/api/v1/withdrawal", withdrawalRoutes);

app.use("/api/v1/admin", adminReferralRoutes);

/* =====================================================
   404 HANDLER
===================================================== */

app.use((req, res, next) => {
  next(
    new AppError(
      `Cannot find ${req.originalUrl} on this server`,
      404
    )
  );
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(globalErrorController);

module.exports = app;