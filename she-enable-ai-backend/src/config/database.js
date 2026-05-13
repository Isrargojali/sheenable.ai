const mongoose = require('mongoose');

let usingMock = false;
let mongoConnected = false;

async function connectDB() {
  // Attempt MongoDB connection with 5 retries
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 100,                    // Support 100k+ concurrent users
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        family: 4,
      });
      mongoConnected = true;
      usingMock = false;
      console.log(`✅ MongoDB connected (attempt ${attempt})`);

      // Setup connection event listeners
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected — switching to MockDB');
        usingMock = true;
      });
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected — switching back to primary');
        usingMock = false;
      });
      return;
    } catch (err) {
      console.warn(`⚠️ MongoDB connection attempt ${attempt}/5 failed: ${err.message}`);
      if (attempt < 5) await new Promise(r => setTimeout(r, 5000));
    }
  }

  // All retries failed — fall back to MockDB
  console.warn('⚠️ MongoDB unavailable — using MockDB fallback. Data stored in .mock-db.json');
  usingMock = true;
  const { initMockDB } = require('./mockDB');
  initMockDB();
}

module.exports = { connectDB, isUsingMock: () => usingMock };
