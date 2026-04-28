// ============================
// 1. UNCAUGHT EXCEPTIONS
// ============================
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION, Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// ============================
// 2. CONFIG
// ============================
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 5000;

// ============================
// 3. IMPORT APP + DB
// ============================
const app = require("./app");
const connectDB = require("./Data/DB");

// ============================
// 4. START SERVER (IMPORTANT)
// ============================

const startServer = async () => {
  try {
    // ✅ WAIT FOR DATABASE
    await connectDB();

    // ✅ START SERVER AFTER DB CONNECTS
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });

    // ============================
    // 5. UNHANDLED REJECTIONS
    // ============================
    process.on("unhandledRejection", (err) => {
      console.log("UNHANDLED REJECTION, Shutting down...");
      console.log(err.name, err.message);

      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();