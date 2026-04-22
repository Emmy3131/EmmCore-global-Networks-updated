const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE);

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;