import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';

// Mock dependencies
const mockAppendSubmissionRow = vi.fn().mockResolvedValue(undefined);
vi.mock('../googleSheets', () => ({
  appendSubmissionRow: mockAppendSubmissionRow,
}));

const mockTrySendSubmissionEmails = vi.fn().mockResolvedValue({ client: true, admin: true });
vi.mock('../email', () => ({
  trySendSubmissionEmails: mockTrySendSubmissionEmails,
}));

// Mock GoogleGenAI
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
    },
  };
});

describe('API Endpoints', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;

  beforeAll(async () => {
    // Set env var before importing app so the AI client is initialized
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const mod = await import('../app');
    app = mod.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockReset();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('POST /api/analyze', () => {
    it('should return analysis result for valid input', async () => {
      // Mock successful AI response
      mockGenerateContent.mockResolvedValueOnce({
        text: () => JSON.stringify({
          summary: 'Test summary',
          category: 'Web',
          estimatedComplexity: 'Low'
        })
      });

      const res = await request(app)
        .post('/api/analyze')
        .send({ description: 'A simple web project description that is long enough.' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        summary: 'Test summary',
        category: 'Web',
        estimatedComplexity: 'Low'
      });
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .send({ description: 'Short' }); // Too short

      expect(res.status).toBe(400);
    });

    it('should handle AI errors gracefully', async () => {
       mockGenerateContent.mockRejectedValueOnce(new Error('AI Error'));

       const res = await request(app)
         .post('/api/analyze')
         .send({ description: 'A simple web project description that is long enough.' });

       expect(res.status).toBe(500);
    });
  });

  describe('POST /api/chat', () => {
    it('should return chat reply', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: () => 'AI reply'
      });

      const res = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }]
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ reply: 'AI reply' });
    });
  });

  describe('POST /api/submit', () => {
    const validSubmission = {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: 'Test Address',
      projectTitle: 'Test Project',
      projectDescription: 'A detailed description of the project.',
      projectType: 'web',
      budget: '$1000',
      aiAnalysis: {
        summary: 'Summary',
        category: 'Web',
        estimatedComplexity: 'Low'
      }
    };

    it('should submit successfully', async () => {
      const res = await request(app)
        .post('/api/submit')
        .send(validSubmission);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should fail with 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/submit')
        .send({ ...validSubmission, email: 'invalid-email' });

      expect(res.status).toBe(400);
    });
  });
});
