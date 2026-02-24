import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import { appendSubmissionRow } from './googleSheets';
import { trySendSubmissionEmails } from './email';
import { AnalyzeBody, ChatBody, SubmitBody, analysisSchema } from './schemas';

/* =========================
   App setup
========================= */

export const app = express();

/* =========================
   Gemini AI setup
========================= */

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not set');
}

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/* =========================
   Middleware
========================= */

app.use(helmet());

/* 🔒 FIXED CORS CONFIG - ALLOWS ALL VERCEL DOMAINS */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Allow all Vercel domains
      if (origin.includes('vercel.app')) return callback(null, true);

      // Allow localhost for development
      if (origin.includes('localhost')) return callback(null, true);

      // Reject all other origins
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  }),
);

/* ✅ Preflight support */
app.options('*', cors());

app.use(express.json({ limit: '1mb' }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 30,
  }),
);

/* =========================
   Helper
========================= */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getResponseText(resp: any): Promise<string> {
  try {
    if (typeof resp?.text === 'function') {
      const v = resp.text();
      return typeof v === 'string' ? v : await v;
    }
    const parts = resp?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parts.map((p: any) => p?.text ?? '').join('');
    }
  } catch {}
  return '';
}

/* =========================
   Routes
========================= */

app.post('/api/analyze', async (req, res) => {
  if (!ai) return res.status(500).send('AI not configured');

  const parsed = AnalyzeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).send('Invalid input');

  try {
    const prompt = `
Analyze the following project description and return strict JSON.

${parsed.data.description}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const raw = await getResponseText(response);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error(err);
    return res.status(500).send('Analyze failed');
  }
});

app.post('/api/chat', async (req, res) => {
  if (!ai) return res.status(500).send('AI not configured');

  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).send('Invalid input');

  try {
    const prompt = parsed.data.messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const reply = await getResponseText(response);
    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Chat failed');
  }
});

app.post('/api/submit', async (req, res) => {
  console.log('📥 Received submission:', req.body);

  const parsed = SubmitBody.safeParse(req.body);

  if (!parsed.success) {
    console.error('❌ Validation failed:', parsed.error.issues);
    return res.status(400).json({
      error: 'Validation failed',
      issues: parsed.error.issues,
    });
  }

  try {
    const d = parsed.data;
    const timestamp = new Date().toISOString();

    await appendSubmissionRow([
      timestamp,
      d.name,
      d.email,
      d.phoneNumber,
      d.collegeName,
      d.address,
      d.projectTitle,
      d.projectDescription,
      d.projectType,
      d.budget,
      d.aiAnalysis?.summary || '',
      d.aiAnalysis?.category || '',
      d.aiAnalysis?.estimatedComplexity || '',
    ]);

    void trySendSubmissionEmails({
      name: d.name,
      email: d.email,
      projectTitle: d.projectTitle,
      projectDescription: d.projectDescription,
      projectType: d.projectType,
      budget: d.budget,
      aiAnalysis: d.aiAnalysis || undefined,
    }).then((r) => {
      // This route returns quickly; this log is your confirmation in Render logs.
      console.log('📧 Email send result:', r);
    });

    console.log('✅ Submission successful!');
    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Submit error:', err);
    return res.status(500).send('Submit failed');
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/', (_req, res) => {
  res.send('Project Catalyst API running');
});
