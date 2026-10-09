import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/app_test',
    },
  },
});
