const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Company = require('../models/Company');

describe('POST /api/auth/register', () => {
  test('registers a new candidate and auto-creates a CandidateProfile', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alex@example.com');
    expect(res.body.user.role).toBe('candidate');
    expect(res.body.user.password).toBeUndefined(); // never leak the hash

    const profile = await CandidateProfile.findOne({ userId: res.body.user._id });
    expect(profile).not.toBeNull();
  });

  test('registers a new employer and auto-creates a Company', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      password: 'Password123',
      role: 'employer',
      companyName: 'NovaTech Solutions',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('employer');

    const company = await Company.findOne({ ownerId: res.body.user._id });
    expect(company).not.toBeNull();
    expect(company.name).toBe('NovaTech Solutions');
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: 'dupe@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'dupe@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'short@example.com',
      password: 'abc123',
      role: 'candidate',
    });

    expect(res.status).toBe(400);
  });

  test('rejects a password with no digit', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Digit',
      email: 'nodigit@example.com',
      password: 'passwordonly',
      role: 'candidate',
    });

    expect(res.status).toBe(400);
  });

  test('silently forces role to candidate if an invalid/unsupported role is sent', async () => {
    // Guards against privilege escalation: nothing in the public register
    // endpoint should ever be able to create an admin account.
    const res = await request(app).post('/api/auth/register').send({
      name: 'Would Be Admin',
      email: 'notadmin@example.com',
      password: 'Password123',
      role: 'admin',
    });

    // express-validator's isIn(['candidate','employer']) rejects 'admin'
    // outright at the validation layer, before it ever reaches the
    // controller's own role-forcing logic.
    expect(res.status).toBe(400);

    const user = await User.findOne({ email: 'notadmin@example.com' });
    expect(user).toBeNull();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'Password123',
      role: 'candidate',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  test('rejects an incorrect password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects a non-existent email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns the current user with a valid token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Me Test',
      email: 'metest@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('metest@example.com');
  });
});

describe('POST /api/auth/forgot-password', () => {
  test('returns success and generates a reset token for a real account, without leaking it in the response', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Reset Me',
      email: 'resetme@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'resetme@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resetToken).toBeUndefined(); // must never appear in the HTTP response

    const user = await User.findOne({ email: 'resetme@example.com' });
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpire).toBeDefined();
  });

  test('returns the same success response for a non-existent email (no account enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PUT /api/auth/reset-password/:resetToken', () => {
  test('resets the password with a valid token and allows login with the new password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Full Reset Flow',
      email: 'fullreset@example.com',
      password: 'OldPassword123',
      role: 'candidate',
    });

    const user = await User.findOne({ email: 'fullreset@example.com' });
    const rawToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetRes = await request(app)
      .put(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'NewPassword123' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.token).toBeDefined();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fullreset@example.com', password: 'NewPassword123' });
    expect(loginRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fullreset@example.com', password: 'OldPassword123' });
    expect(oldLoginRes.status).toBe(401);
  });

  test('rejects an invalid/expired reset token', async () => {
    const res = await request(app)
      .put('/api/auth/reset-password/not-a-real-token')
      .send({ password: 'NewPassword123' });

    expect(res.status).toBe(400);
  });
});
