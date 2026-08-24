const mongoose = require("mongoose");

/*
=====================================================
MONGOOSE GLOBAL CACHE
=====================================================
*/

const cached =
  global._mongoose ||
  (global._mongoose = {
    conn: null,
    promise: null,
  });

/*
=====================================================
CONNECT DATABASE
=====================================================
*/

const connectDB = async () => {
  /*
  Already connected
  */
  if (cached.conn) {
    return cached.conn;
  }

  /*
  Make sure DATABASE exists
  */
  if (!process.env.DATABASE) {
    throw new Error(
      "DATABASE environment variable is not defined"
    );
  }

  /*
  Create connection promise
  */
  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    };

    cached.promise = mongoose
      .connect(process.env.DATABASE, options)
      .then((mongooseInstance) => {
        console.log(
          `✅ MongoDB Connected: ${mongooseInstance.connection.host}`
        );

        return mongooseInstance;
      })
      .catch((error) => {
        console.error(
          "❌ MongoDB Connection Error:",
          error.message
        );

        /*
        Allow a future request to retry.
        */
        cached.promise = null;

        throw error;
      });
  }

  /*
  Wait for connection
  */
  cached.conn = await cached.promise;

  return cached.conn;
};

module.exports = connectDB;