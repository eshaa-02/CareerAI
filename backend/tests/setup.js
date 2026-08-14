const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Keep required env vars present for anything that reads process.env
// during module load (e.g. JWT signing) even though .env isn't loaded in CI.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest-only';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.JWT_COOKIE_EXPIRE = process.env.JWT_COOKIE_EXPIRE || '7';
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '4'; // low cost factor speeds up tests
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Reset all collections between tests so each test starts from a clean
  // slate without needing a fresh server for every single test.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
