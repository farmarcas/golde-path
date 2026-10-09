import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { prisma } from './shared/database/prisma.js';

describe('health', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deve responder ok em /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('deve responder ok em /health/ready quando banco está no ar', async () => {
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
