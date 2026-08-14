/**
 * Creates (or promotes/resets) a single admin account, without touching any
 * other data. Safe to run multiple times — it upserts by email.
 *
 * Usage:
 *   node utils/createAdmin.js <email> <password> [name]
 *
 * Example:
 *   node utils/createAdmin.js you@example.com MySecurePass123 "Jane Admin"
 */
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error('Usage: node utils/createAdmin.js <email> <password> [name]');
  console.error('Example: node utils/createAdmin.js you@example.com MySecurePass123 "Jane Admin"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    user.password = password; // will be re-hashed by the pre-save hook
    user.role = 'admin';
    user.isActive = true;
    user.isSuspended = false;
    await user.save();
    console.log(`Existing user ${email} updated and promoted to admin.`);
  } else {
    user = await User.create({
      name: name || 'Admin User',
      email,
      password,
      role: 'admin',
      isVerified: true,
    });
    console.log(`New admin account created: ${email}`);
  }

  console.log('----------------------------------------');
  console.log(`Login with:  ${email} / (the password you just set)`);
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
