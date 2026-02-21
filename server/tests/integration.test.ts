import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock dependencies
vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue({ client: true, admin: true }),
}));

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor(opts: any) {}
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: () => 'Test response',
      }),
    };
  },
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
  }
}));

describe('Integration Tests', () => {
  it('GET /api/health should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET / should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Project Catalyst API running');
  });

  it('POST /api/submit should accept valid submission', async () => {
    const submission = {
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: '123 Test St',
      projectTitle: 'Test Project',
      projectDescription: 'This is a test project description that is long enough.',
      projectType: 'web',
      budget: '$100',
      aiAnalysis: {
        summary: 'Test summary',
        category: 'Test category',
        estimatedComplexity: 'Low',
      },
    };

    const res = await request(app).post('/api/submit').send(submission);
    // If it fails, check res.body
    if (res.status !== 200) {
      console.error(res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/submit should reject invalid submission', async () => {
    const invalidSubmission = {
      name: '', // Invalid
    };

    const res = await request(app).post('/api/submit').send(invalidSubmission);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
