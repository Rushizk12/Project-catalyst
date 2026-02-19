import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Mock dependencies (hoisted)
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(function() {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: () => JSON.stringify({
              summary: 'Mock Summary',
              category: 'Mock Category',
              estimatedComplexity: 'Medium'
            })
          })
        }
      };
    }),
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' }
  };
});

vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue({ client: true, admin: true }),
}));

describe('Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Set API key before importing app so the AI client initializes
    process.env.GEMINI_API_KEY = 'mock-key';
    const mod = await import('../app');
    app = mod.app;
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/analyze should return mocked analysis', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ description: 'This is a test project description exceeding ten chars' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      summary: 'Mock Summary',
      category: 'Mock Category',
      estimatedComplexity: 'Medium'
    });
  });

  it('POST /api/chat should return mocked reply', async () => {
    // We mock generateContent, so checking chat also returns the mocked JSON string?
    // Wait, the mock returns JSON string for analyze. Chat expects plain text usually?
    // In server/app.ts: `const reply = await getResponseText(response); return res.json({ reply });`
    // And mock returns `{ text: () => JSON.stringify(...) }`.
    // So chat will return JSON string as reply. That's fine for a mock test.

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hello' }] });

    expect(res.status).toBe(200);
    // The mock returns a JSON string, so reply will be that string
    expect(res.body.reply).toContain('Mock Summary');
  });

  it('POST /api/submit should return success', async () => {
    const res = await request(app)
      .post('/api/submit')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        phoneNumber: '1234567890',
        collegeName: 'Test College',
        address: 'Test Address',
        projectTitle: 'Test Project',
        projectDescription: 'This is a test project description exceeding ten chars',
        projectType: 'web',
        budget: '1000',
        aiAnalysis: {
          summary: 'Test Summary',
          category: 'Test Category',
          estimatedComplexity: 'Low'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/submit should fail with invalid data', async () => {
    const res = await request(app)
      .post('/api/submit')
      .send({
        name: '', // Invalid
        email: 'invalid-email' // Invalid
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
