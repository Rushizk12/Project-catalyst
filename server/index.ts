import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { GoogleGenAI, Type } from '@google/genai';
import { appendSubmissionRow, extractSpreadsheetIdFromUrl } from './googleSheets';
import { trySendSubmissionEmails } from './email';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not set. AI endpoints will return 500 until configured.');
}

app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60_000, max: 30 });
app.use('/api/', limiter);

const AnalyzeBody = z.object({
  description: z.string().min(10, 'Description is too short')
});

const ChatBody = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().min(1)
  })).min(1)
});

const SubmitBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(1),
  collegeName: z.string().min(1),
  address: z.string().min(1),
  projectTitle: z.string().min(1),
  projectDescription: z.string().min(10),
  projectType: z.enum(['web', 'mobile', 'design', 'other', 'hardware']),
  budget: z.string().min(1),
  aiAnalysis: z.object({
    summary: z.string(),
    category: z.enum(['Web Development', 'Mobile App Development', 'UI/UX Design', 'Other', 'Hardware']),
    estimatedComplexity: z.enum(['Low', 'Medium', 'High'])
  }).nullable().optional()
});

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['Web Development', 'Mobile App Development', 'UI/UX Design', 'Other', 'Hardware'] },
    estimatedComplexity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
  },
  required: ['summary', 'category', 'estimatedComplexity']
};

// Helper to normalize GenAI responses across SDK variants
async function getResponseText(resp: any): Promise<string> {
  try {
    if (!resp) return '';
    if (typeof resp.text === 'string') return resp.text;
    if (typeof resp.text === 'function') {
      const v = resp.text();
      // Some SDKs return string; others return Promise<string>
      if (typeof v === 'string') return v;
      if (v && typeof v.then === 'function') return await v;
    }
    const parts = resp.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      return parts.map((p: any) => p?.text ?? '').join('');
    }
  } catch {
    // swallow
  }
  return '';
}

app.post('/api/analyze', async (req, res) => {
  if (!ai) {
    return res.status(500).send('Server missing GEMINI_API_KEY');
  }
  const parse = AnalyzeBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).send(parse.error.issues[0]?.message || 'Invalid input');
  }
  try {
    const prompt = `Analyze the following project description for a freelance developer. Based on the description, provide a concise one-sentence summary, categorize the project into one of the predefined categories, and estimate its complexity.\n\nProject Description:\n---\n${parse.data.description}\n---\n\nReturn strict JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      generationConfig: { // was: config
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const raw = await getResponseText(response);
    const text = raw?.trim?.() || '';
    const jsonStr = text.startsWith('```') ? text.replace(/```json\n?|```/g, '') : text;
    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);
  } catch (err) {
    console.error('Analyze error', err);
    return res.status(500).send('Failed to analyze');
  }
});

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    return res.status(500).send('Server missing GEMINI_API_KEY');
  }
  const parse = ChatBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).send(parse.error.issues[0]?.message || 'Invalid input');
  }
  try {
    const prompt = parse.data.messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const reply = (await getResponseText(response)) || '';
    return res.json({ reply });
  } catch (err) {
    console.error('Chat error', err);
    return res.status(500).send('Failed to chat');
  }
});

// Admin emails (comma-separated). Supports ADMIN_NOTIFICATION_EMAILS or single ADMIN_EMAIL.
const adminEmails: string[] = (process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

app.post('/api/submit', async (req, res) => {
  const parse = SubmitBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).send(parse.error.issues[0]?.message || 'Invalid input');
  }
  try {
    const data = parse.data;
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      data.name,
      data.email,
      data.phoneNumber,
      data.collegeName,
      data.address,
      data.projectTitle,
      data.projectDescription,
      data.projectType,
      data.budget,
      data.aiAnalysis?.summary || '',
      data.aiAnalysis?.category || '',
      data.aiAnalysis?.estimatedComplexity || ''
    ];
    await appendSubmissionRow(row);
    // Fire-and-forget email sending; don't block the response on email errors
    try {
      void trySendSubmissionEmails({
        name: data.name,
        email: data.email,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        projectType: data.projectType,
        budget: data.budget,
        aiAnalysis: data.aiAnalysis || undefined,
        // Notify admins if configured
        adminRecipients: adminEmails.length ? adminEmails : undefined,
      });
    } catch (e) {
      // Already handled/logged inside email service
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Submit error', err);
    const message = err instanceof Error ? err.message : String(err);
    const responseMessage = process.env.NODE_ENV === 'production' ? 'Failed to save submission' : message;
    return res.status(500).send(responseMessage);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/debug-env', (_req, res) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || extractSpreadsheetIdFromUrl(process.env.GOOGLE_SHEETS_SPREADSHEET_URL || '') || null;
  const hasKey = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
  const hasEmail = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const sheet = process.env.GOOGLE_SHEETS_WORKSHEET_TITLE || 'Sheet1';
  res.json({
    spreadsheetIdPresent: Boolean(spreadsheetId),
    worksheetTitle: sheet,
    serviceAccountEmailPresent: hasEmail,
    serviceAccountPrivateKeyPresent: hasKey,
    adminRecipientsCount: adminEmails.length
  });
});

// Friendly root route for convenience when visiting http://localhost:3001/
app.get('/', (_req, res) => {
  res.type('text/plain').send('Project Catalyst API is running. Try /api/health');
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});


