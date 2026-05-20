/**
 * she-enable-ai-backend/src/config/seed.js
 *
 * Creates the one-time SUPER_ADMIN account from environment variables.
 * Safe to run multiple times — skips if the account already exists.
 *
 * Usage:
 *   cd she-enable-ai-backend
 *   npm run seed
 *
 * Required .env variables:
 *   MONGO_URI=...
 *   ADMIN_SEED_EMAIL=superadmin@sheenableai.com
 *   ADMIN_SEED_PASSWORD=SomeStr0ng!Pass
 *   ADMIN_SEED_FIRSTNAME=Super
 *   ADMIN_SEED_LASTNAME=Admin
 */

require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

// ==============================
// Constants
// ==============================

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// ==============================
// Environment Variables
// ==============================

const {
  MONGO_URI,
  NODE_ENV,
  ADMIN_SEED_EMAIL,
  ADMIN_SEED_PASSWORD,
  ADMIN_SEED_FIRSTNAME = 'Super',
  ADMIN_SEED_LASTNAME = 'Admin',
} = process.env;

// ==============================
// Validate Required Variables
// ==============================

if (!MONGO_URI || !ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD) {
  console.error(
    '❌ Missing required env vars: MONGO_URI, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD'
  );

  process.exit(1);
}

// ==============================
// Prevent Accidental Production Seeding
// ==============================

if (NODE_ENV === 'production') {
  console.error(
    '❌ Seeder execution is disabled in production for security reasons.'
  );

  process.exit(1);
}

// ==============================
// Seed Function
// ==============================

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);

    console.log('✅ Connected to MongoDB');

    // Normalize Email
    const email = ADMIN_SEED_EMAIL.trim().toLowerCase();

    // Check Existing Admin
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(
        `ℹ️ SUPER_ADMIN already exists (${existing.email}) — skipping.`
      );

      return;
    }

    // Create SUPER_ADMIN
    const admin = await User.create({
      email,
      password: ADMIN_SEED_PASSWORD, // hashed by model pre-save hook
      firstName: ADMIN_SEED_FIRSTNAME.trim(),
      lastName: ADMIN_SEED_LASTNAME.trim(),
      role: ROLES.SUPER_ADMIN,
      gender: 'prefer-not-to-say',
      isVerified: true,
      isActive: true,
    });

    console.log('✅ SUPER_ADMIN account created successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🆔 ID: ${admin._id}`);

    console.log(
      '⚠️ Store these credentials securely in a password manager.'
    );

    process.exitCode = 0;
  } catch (err) {
    console.error('❌ Seed failed');
    console.error(err);

    process.exitCode = 1;
  } finally {
    // Always disconnect
    try {
      await mongoose.disconnect();

      console.log('🔌 MongoDB disconnected');
    } catch (disconnectError) {
      console.error('❌ Failed to disconnect MongoDB');
      console.error(disconnectError);
    }
  }
}

// ==============================
// Execute Seeder
// ==============================

seed();
