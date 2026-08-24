const dotenv = require("dotenv");

dotenv.config({
  path: "./config.env",
});

const app = require("./app");
const connectDB = require("./Data/DB");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // ================================================
    // CONNECT TO DATABASE
    // ================================================

    await connectDB();

    // ================================================
    // VERIFY EXPRESS APP
    // ================================================

    if (typeof app !== "function") {
      throw new Error(
        "Express app was not exported correctly from app.js"
      );
    }

    // ================================================
    // START LOCAL SERVER
    // ================================================

    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    });

    // ================================================
    // UNHANDLED PROMISE REJECTION
    // ================================================

    process.on("unhandledRejection", (error) => {
      console.error(
        "❌ UNHANDLED REJECTION:",
        error
      );

      server.close(() => {
        process.exit(1);
      });
    });

    // ================================================
    // UNCAUGHT EXCEPTION
    // ================================================

    process.on("uncaughtException", (error) => {
      console.error(
        "❌ UNCAUGHT EXCEPTION:",
        error
      );

      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error(
      "❌ FAILED TO START SERVER:",
      error
    );

    process.exit(1);
  }
};

startServer();