const mongoose = require("mongoose");

// 🔥 cache connection across serverless executions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null
  };
}

const connectDB = async () => {
  // ✅ already connected
  if (cached.conn) {
    return cached.conn;
  }

  // ✅ create connection once
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.DATABASE, {
      bufferCommands: false
    }).then((mongooseInstance) => {
      console.log(
        `MongoDB Atlas Connected: ${mongooseInstance.connection.host}`
      );
      return mongooseInstance;
    });
  }

  // ✅ wait for connection
  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;