import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';

// Mock dependencies
vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue({ client: true, admin: true }),
}));

// Import mocks to assert on them
import { appendSubmissionRow } from '../googleSheets';
import { trySendSubmissionEmails } from '../email';

describe('POST /api/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully submit a valid project with AI analysis', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: 'Test Address',
      projectTitle: 'Test Project',
      projectDescription: 'This is a detailed description of the test project.',
      projectType: 'web',
      budget: 'Low',
      aiAnalysis: {
        summary: 'A test project summary',
        category: 'Web Development',
        estimatedComplexity: 'Low',
      },
    };

    const res = await request(app)
      .post('/api/submit')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    // Verify Google Sheets call
    expect(appendSubmissionRow).toHaveBeenCalledTimes(1);

    // Check key fields in the array
    const sheetsArgs = vi.mocked(appendSubmissionRow).mock.calls[0][0] as any[];
    expect(sheetsArgs[1]).toBe(payload.name);
    expect(sheetsArgs[6]).toBe(payload.projectTitle);
    expect(sheetsArgs[10]).toBe(payload.aiAnalysis.summary);
    expect(sheetsArgs[11]).toBe(payload.aiAnalysis.category);
    expect(sheetsArgs[12]).toBe(payload.aiAnalysis.estimatedComplexity);

    // Verify Email call
    expect(trySendSubmissionEmails).toHaveBeenCalledTimes(1);
    const emailArgs = vi.mocked(trySendSubmissionEmails).mock.calls[0][0];
    expect(emailArgs).toEqual(expect.objectContaining({
      name: payload.name,
      email: payload.email,
      projectTitle: payload.projectTitle,
      aiAnalysis: payload.aiAnalysis,
    }));
  });

  it('should return 400 for invalid data', async () => {
    const payload = {
      name: '', // Invalid
      email: 'not-an-email', // Invalid
    };

    const res = await request(app)
      .post('/api/submit')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');

    expect(appendSubmissionRow).not.toHaveBeenCalled();
    expect(trySendSubmissionEmails).not.toHaveBeenCalled();
  });
});
