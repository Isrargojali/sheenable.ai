const mongoose = require('mongoose');

let retries = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4 to avoid IPv6 issues
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    retries = 0;
    return true;
  } catch (error) {
    retries++;
    console.error(`✗ MongoDB Connection Error (Attempt ${retries}/${MAX_RETRIES}): ${error.message}`);
    
    if (retries < MAX_RETRIES) {
      console.warn(`⚠ Retrying connection in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(() => {
        connectDB();
      }, RETRY_INTERVAL);
    } else {
      console.warn(`⚠ Max retries reached. Server will start without database. Manual retry recommended.`);
    }
    
    return false;
  }
};

module.exports = connectDB;
