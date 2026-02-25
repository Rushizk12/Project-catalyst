import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';

// Mock dependencies
vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue({ client: true, admin: true }),
}));

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: () => JSON.stringify({
            summary: 'Test Summary',
            category: 'Test Category',
            estimatedComplexity: 'Low'
          }),
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({
                summary: 'Test Summary',
                category: 'Test Category',
                estimatedComplexity: 'Low'
              }) }]
            }
          }]
        })
      }
    })),
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' }
  };
});

describe('API Tests', () => {
  // Set env vars before tests
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/submit accepts valid data', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: '123 Test St',
      projectTitle: 'Test Project',
      projectDescription: 'This is a test project description that is long enough.',
      projectType: 'web',
      budget: '1000',
      aiAnalysis: {
        summary: 'Summary',
        category: 'Category',
        estimatedComplexity: 'Low'
      }
    };

    const res = await request(app).post('/api/submit').send(payload);

    // If fails, log body to debug
    if (res.status !== 200) {
      console.log('Submit failed:', res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/submit rejects invalid email', async () => {
    const payload = {
      name: 'Test User',
      email: 'not-an-email',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: '123 Test St',
      projectTitle: 'Test Project',
      projectDescription: 'Short',
      projectType: 'web',
      budget: '1000'
    };

    const res = await request(app).post('/api/submit').send(payload);
    expect(res.status).toBe(400);
  });
});
