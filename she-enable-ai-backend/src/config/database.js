const mongoose = require('mongoose');

let usingMock = false;

// ─── Connection options tuned for Atlas M0 free tier stability ────────────────
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 30000,  // 30s — M0 clusters can be slow to wake up
  socketTimeoutMS:          60000,  // 60s — keep socket alive during slow queries
  heartbeatFrequencyMS:     10000,  // ping every 10s to detect drops early
  maxPoolSize:              10,     // M0 free tier max concurrent connections is 100; keep conservative
  minPoolSize:              2,      // maintain at least 2 idle connections
  maxIdleTimeMS:            30000,  // close idle connections after 30s
  retryWrites:              true,
  retryReads:               true,
  family:                   4,      // Force IPv4 (avoids IPv6 DNS resolution issues on Windows)
  bufferCommands:           true,   // Buffer commands while reconnecting (prevents crash)
};

async function connectDB() {
  // Initial connection with retry loop
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
      usingMock = false;
      console.log(`✅ MongoDB connected (attempt ${attempt})`);
      _registerConnectionEvents();
      return;
    } catch (err) {
      console.warn(`⚠️  MongoDB attempt ${attempt}/5 failed: ${err.message}`);
      if (attempt < 5) {
        const delay = attempt * 3000; // backoff: 3s, 6s, 9s, 12s
        console.log(`    Retrying in ${delay / 1000}s…`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // All retries exhausted
  console.error('❌ MongoDB unavailable after 5 attempts. Check MONGO_URI and Atlas IP whitelist.');
  usingMock = true;
  try {
    const { initMockDB } = require('./mockDB');
    initMockDB();
    console.warn('⚠️  Falling back to MockDB (.mock-db.json)');
  } catch (e) {
    console.error('MockDB init failed too:', e.message);
  }
}

function _registerConnectionEvents() {
  const conn = mongoose.connection;

  conn.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected — Mongoose will auto-reconnect');
    usingMock = false; // Don't switch to mock — let Mongoose buffer and reconnect
  });

  conn.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
    usingMock = false;
  });

  conn.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
    // Mongoose handles reconnection automatically; don't call process.exit here
  });

  conn.on('close', () => {
    console.warn('⚠️  MongoDB connection closed');
  });
}

module.exports = { connectDB, isUsingMock: () => usingMock };
