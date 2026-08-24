const dotenv = require("dotenv");

dotenv.config({
  path: "./config.env",
});

const app = require("./app");
const connectDB = require("./Data/DB");

let dbPromise = null;

const ensureDatabaseConnection = async () => {
  if (!dbPromise) {
    dbPromise = connectDB().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureDatabaseConnection();

    return app(req, res);
  } catch (error) {
    console.error(
      "SERVER / DATABASE ERROR:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        status: "error",
        message: "Unable to connect to the server",
      });
    }
  }
};