// ============================
// 1. UNCAUGHT EXCEPTIONS (TOP)
// ============================
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION, Shutting down...");
  console.log(err.name, err.message, err);
  process.exit(1);
});

// ============================
// 2. CONFIG
// ============================
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const port = process.env.PORT;


// ============================
// 3. IMPORT APP
// ============================
const app = require("./app");


// ============================
// 4. DATABASE CONNECTION
// ============================
const DB = require("./Data/DB");

DB();


// ============================
// 5. START SERVER
// ============================

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


// ============================
// 6. UNHANDLED REJECTIONS
// ============================
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION, Shutting down...");
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});