const mongoose = require('mongoose')

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    let conn;

    if(process.env.NODE_ENV === 'production') {
      conn = process.env.DATABASE
    }else{
      conn = process.env.DATABASE_LOCAL
    }
    const res = await mongoose.connect(conn);

    console.log(`MongoDB Connected: ${res.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;