import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { appendSubmissionRow } from '../googleSheets';

vi.mock('../googleSheets', () => ({
  appendSubmissionRow: vi.fn(),
}));

vi.mock('../email', () => ({
  trySendSubmissionEmails: vi.fn().mockResolvedValue({ client: true, admin: true }),
}));

describe('POST /api/submit', () => {
  it('should process submission with AI analysis', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      collegeName: 'Test College',
      address: 'Test Address',
      projectTitle: 'Test Project',
      projectDescription: 'This is a test project description sufficient length.',
      projectType: 'web',
      budget: '5000',
      aiAnalysis: {
        summary: 'Test Summary',
        category: 'Test Category',
        estimatedComplexity: 'Medium',
      },
    };

    const res = await request(app)
      .post('/api/submit')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const expectedRow = [
      expect.any(String), // timestamp
      payload.name,
      payload.email,
      payload.phoneNumber,
      payload.collegeName,
      payload.address,
      payload.projectTitle,
      payload.projectDescription,
      payload.projectType,
      payload.budget,
      payload.aiAnalysis.summary,
      payload.aiAnalysis.category,
      payload.aiAnalysis.estimatedComplexity,
    ];

    expect(appendSubmissionRow).toHaveBeenCalledWith(expectedRow);
  });

  it('should process submission without AI analysis', async () => {
    const payload = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phoneNumber: '0987654321',
      collegeName: 'Another College',
      address: 'Another Address',
      projectTitle: 'Another Project',
      projectDescription: 'This is another test project description.',
      projectType: 'mobile',
      budget: '10000',
    };

    const res = await request(app)
      .post('/api/submit')
      .send(payload);

    expect(res.status).toBe(200);

    const expectedRow = [
      expect.any(String),
      payload.name,
      payload.email,
      payload.phoneNumber,
      payload.collegeName,
      payload.address,
      payload.projectTitle,
      payload.projectDescription,
      payload.projectType,
      payload.budget,
      '', // summary
      '', // category
      '', // complexity
    ];

    expect(appendSubmissionRow).toHaveBeenCalledWith(expectedRow);
  });
});
