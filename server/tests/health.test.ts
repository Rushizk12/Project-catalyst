import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock environment variables to avoid warnings
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock external services to prevent actual network calls or errors during import
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      getGenerativeModel() {
        return {
          generateContent: vi.fn(),
        };
      }
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
    },
  };
});

// Import the app after mocking
import { app } from '../app';

describe('API Health Check', () => {
  it('GET /api/health returns 200 and { ok: true }', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
