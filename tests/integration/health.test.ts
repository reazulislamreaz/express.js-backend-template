import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app.js';

describe('Health endpoints', () => {
  const app = createApp();

  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /unknown returns 404', async () => {
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
