import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Set env var before importing app (might not work due to hoisting, but we passed it in command line)
process.env.GEMINI_API_KEY = 'test-key';

import { app } from '../app';
import { appendSubmissionRow } from '../googleSheets';
import { trySendSubmissionEmails } from '../email';

// Mock dependencies
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: () =>
            JSON.stringify({
              summary: 'Test Summary',
              category: 'Test Category',
              estimatedComplexity: 'Low',
            }),
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: 'Test Summary',
                      category: 'Test Category',
                      estimatedComplexity: 'Low',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
      constructor() {}
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
    },
  };
});

vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue({ client: true, admin: true }),
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/analyze returns analysis', async () => {
    const res = await request(app).post('/api/analyze').send({
      description:
        'A simple web project for testing purposes that needs to be at least 10 chars long.',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      summary: 'Test Summary',
      category: 'Test Category',
      estimatedComplexity: 'Low',
    });
  });

  it('POST /api/submit saves to sheets and sends email', async () => {
    const submission = {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: '123 Test St',
      projectTitle: 'Test Project',
      projectDescription: 'This is a description of the test project that is long enough.',
      projectType: 'web',
      budget: '1000',
      aiAnalysis: {
        summary: 'Summary',
        category: 'Web',
        estimatedComplexity: 'Low',
      },
    };

    const res = await request(app).post('/api/submit').send(submission);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    expect(appendSubmissionRow).toHaveBeenCalled();
    expect(trySendSubmissionEmails).toHaveBeenCalled();
  });

  it('POST /api/submit fails with invalid data', async () => {
    const submission = {
      name: '', // Invalid
      email: 'not-an-email', // Invalid
    };

    const res = await request(app).post('/api/submit').send(submission);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
