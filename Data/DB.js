const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| GLOBAL CACHE (Vercel Serverless Optimization)
|--------------------------------------------------------------------------
*/

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = {
    conn: null,
    promise: null,
  };
}

/*
|--------------------------------------------------------------------------
| CONNECT DATABASE
|--------------------------------------------------------------------------
*/

const connectDB = async () => {
  // ✅ already connected
  if (cached.conn) {
    return cached.conn;
  }

  // ✅ create connection promise once
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(process.env.DATABASE, opts)
      .then((mongooseInstance) => {
        console.log(
          `✅ MongoDB Connected: ${mongooseInstance.connection.host}`
        );
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null; // allow retry
        console.error("❌ MongoDB Connection Error:", err);
        throw err;
      });
  }

  // ✅ wait for connection
  cached.conn = await cached.promise;

  return cached.conn;
};

module.exports = connectDB;