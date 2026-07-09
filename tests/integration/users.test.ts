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

async function loginAs(app: ReturnType<typeof createApp>, email: string, password: string) {
  const res = await request(app).post(`${API}/auth/login`).send({ email, password });
  expect(res.status).toBe(200);
  return res.body.data.tokens.accessToken as string;
}

describe('Users endpoints', () => {
  const app = createApp();
  let databaseReady = false;

  beforeAll(async () => {
    try {
      await connectTestDatabase();
      databaseReady = true;
    } catch {
      console.warn('PostgreSQL unavailable — skipping users integration tests');
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

  it('allows admins to list users and blocks regular users', async ({ skip }) => {
    if (!databaseReady) skip();

    await createTestUser({
      email: 'admin@example.com',
      password: 'Password1',
      role: Role.ADMIN,
    });
    await createTestUser({
      email: 'user@example.com',
      password: 'Password1',
    });

    const adminToken = await loginAs(app, 'admin@example.com', 'Password1');
    const userToken = await loginAs(app, 'user@example.com', 'Password1');

    const adminList = await request(app)
      .get(`${API}/users`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminList.status).toBe(200);
    expect(adminList.body.data.length).toBe(2);

    const userList = await request(app)
      .get(`${API}/users`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(userList.status).toBe(403);
  });

  it('allows users to read their own profile but not others', async ({ skip }) => {
    if (!databaseReady) skip();

    const user = await createTestUser({
      email: 'self@example.com',
      password: 'Password1',
    });
    const other = await createTestUser({
      email: 'other@example.com',
      password: 'Password1',
    });

    const token = await loginAs(app, 'self@example.com', 'Password1');

    const ownProfile = await request(app)
      .get(`${API}/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(ownProfile.status).toBe(200);
    expect(ownProfile.body.data.email).toBe('self@example.com');

    const otherProfile = await request(app)
      .get(`${API}/users/${other.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(otherProfile.status).toBe(403);
  });

  it('allows admins to deactivate users and revokes their sessions', async ({ skip }) => {
    if (!databaseReady) skip();

    await createTestUser({
      email: 'admin@example.com',
      password: 'Password1',
      role: Role.ADMIN,
    });
    const target = await createTestUser({
      email: 'target@example.com',
      password: 'Password1',
    });

    const adminToken = await loginAs(app, 'admin@example.com', 'Password1');

    const loginRes = await request(app).post(`${API}/auth/login`).send({
      email: 'target@example.com',
      password: 'Password1',
    });
    const targetRefreshToken = loginRes.body.data.tokens.refreshToken;

    const deactivateRes = await request(app)
      .post(`${API}/users/${target.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.isActive).toBe(false);

    const refreshRes = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: targetRefreshToken });

    expect(refreshRes.status).toBe(401);
  });

  it('prevents admins from deactivating themselves', async ({ skip }) => {
    if (!databaseReady) skip();

    const admin = await createTestUser({
      email: 'admin@example.com',
      password: 'Password1',
      role: Role.ADMIN,
    });

    const adminToken = await loginAs(app, 'admin@example.com', 'Password1');

    const res = await request(app)
      .post(`${API}/users/${admin.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });
});
