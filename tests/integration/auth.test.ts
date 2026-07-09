import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '@/app.js';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  resetDatabase,
  createTestUser,
} from './helpers/db.js';

const API = '/api/v1';

describe('Auth endpoints', () => {
  const app = createApp();
  let databaseReady = false;

  beforeAll(async () => {
    try {
      await connectTestDatabase();
      databaseReady = true;
    } catch {
      console.warn('PostgreSQL unavailable — skipping auth integration tests');
    }
  });

  afterAll(async () => {
    if (databaseReady) {
      await disconnectTestDatabase();
    }
  });

  beforeEach(async () => {
    if (databaseReady) {
      await resetDatabase();
    }
  });

  it('registers, logs in, refreshes, accesses /me, and logs out', async ({ skip }) => {
    if (!databaseReady) skip();

    const registerRes = await request(app).post(`${API}/auth/register`).send({
      email: 'user@example.com',
      password: 'Password1',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.user.email).toBe('user@example.com');
    expect(registerRes.body.data.tokens.accessToken).toBeDefined();
    expect(registerRes.body.data.tokens.refreshToken).toBeDefined();

    const { accessToken, refreshToken } = registerRes.body.data.tokens;

    const meRes = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('user@example.com');

    const refreshRes = await request(app).post(`${API}/auth/refresh`).send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens.refreshToken).not.toBe(refreshToken);

    const newRefreshToken = refreshRes.body.data.tokens.refreshToken;

    const logoutRes = await request(app)
      .post(`${API}/auth/logout`)
      .send({ refreshToken: newRefreshToken });

    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: newRefreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });

  it('logs in with valid credentials', async ({ skip }) => {
    if (!databaseReady) skip();

    await request(app).post(`${API}/auth/register`).send({
      email: 'login@example.com',
      password: 'Password1',
    });

    const loginRes = await request(app).post(`${API}/auth/login`).send({
      email: 'login@example.com',
      password: 'Password1',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.tokens.accessToken).toBeDefined();
  });

  it('rejects invalid login credentials', async ({ skip }) => {
    if (!databaseReady) skip();

    const res = await request(app).post(`${API}/auth/login`).send({
      email: 'missing@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('does not reveal existing emails on duplicate registration', async ({ skip }) => {
    if (!databaseReady) skip();

    await request(app).post(`${API}/auth/register`).send({
      email: 'taken@example.com',
      password: 'Password1',
    });

    const res = await request(app).post(`${API}/auth/register`).send({
      email: 'taken@example.com',
      password: 'Password2',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Unable to complete registration');
    expect(res.body.error.message).not.toContain('already');
  });

  it('rejects inactive users at login', async ({ skip }) => {
    if (!databaseReady) skip();

    const registerRes = await request(app).post(`${API}/auth/register`).send({
      email: 'inactive@example.com',
      password: 'Password1',
    });

    const userId = registerRes.body.data.user.id;

    await createTestUser({
      email: 'admin@example.com',
      password: 'Password1',
      role: Role.ADMIN,
    });

    const adminLogin = await request(app).post(`${API}/auth/login`).send({
      email: 'admin@example.com',
      password: 'Password1',
    });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.data.tokens.accessToken;

    await request(app)
      .post(`${API}/users/${userId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    const loginRes = await request(app).post(`${API}/auth/login`).send({
      email: 'inactive@example.com',
      password: 'Password1',
    });

    expect(loginRes.status).toBe(401);
  });
});
