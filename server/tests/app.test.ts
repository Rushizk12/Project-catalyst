import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Mocks must be at top level
vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ summary: 'Test', category: 'Web', estimatedComplexity: 'Low' }) }],
            },
          },
        ],
      }),
    };
    constructor(_apiKey: any) {}
  }

  return {
    GoogleGenAI,
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
  };
});

vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue('Email sent'),
}));

describe('Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Set env var before importing app
    process.env.GEMINI_API_KEY = 'test-key';

    // Dynamic import to ensure env vars are picked up
    const mod = await import('../app');
    app = mod.default;
  });

  it('GET /api/health should return 200 OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('POST /api/analyze should return analysis', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ description: 'This is a test project description with enough length.' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('category');
    expect(response.body).toHaveProperty('estimatedComplexity');
  });

  it('POST /api/submit should accept valid submission', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: 'Test Address',
      projectTitle: 'Test Project',
      projectDescription: 'This is a description long enough.',
      projectType: 'web',
      budget: '100',
      aiAnalysis: {
        summary: 'Summary',
        category: 'Web',
        estimatedComplexity: 'Low',
      },
    };

    const response = await request(app).post('/api/submit').send(payload);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
