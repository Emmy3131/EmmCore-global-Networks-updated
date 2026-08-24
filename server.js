// =====================================================
// EMMCORE GLOBAL NETWORKS - VERCEL ENTRY POINT
// =====================================================

const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "./config.env" });

// Import Express application
const app = require("./app");

// Import database connection
const connectDB = require("./Data/DB");

// Prevent the same database connection from being
// established repeatedly during warm Vercel invocations.
let dbConnectionPromise = null;

const connectDatabase = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      // Allow a future invocation to retry the connection
      dbConnectionPromise = null;
      throw error;
    });
  }

  return dbConnectionPromise;
};

// =====================================================
// VERCEL SERVERLESS HANDLER
// =====================================================

const handler = async (req, res) => {
  try {
    // Make sure MongoDB is connected before handling
    // the request.
    await connectDatabase();

    // Pass the request to Express
    return app(req, res);
  } catch (error) {
    console.error("DATABASE / SERVER ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Server failed to initialize",
    });
  }
};

module.exports = handler;