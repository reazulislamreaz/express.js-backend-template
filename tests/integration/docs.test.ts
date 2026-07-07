import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app.js';

describe('API docs', () => {
  const app = createApp();

  it('GET /api/v1/openapi.json returns the OpenAPI document', async () => {
    const res = await request(app).get('/api/v1/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/auth/login']).toBeDefined();
    expect(
      res.body.paths['/users/{id}'].patch.requestBody.content['application/json'].example,
    ).toEqual({
      firstName: 'Janet',
      lastName: 'Doe',
    });
  });

  it('GET /api/v1/docs/ returns Swagger UI HTML', async () => {
    const res = await request(app).get('/api/v1/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
  });
});
