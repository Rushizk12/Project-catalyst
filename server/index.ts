import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { GoogleGenAI, Type } from '@google/genai';
import { appendSubmissionRow } from './googleSheets';
import { trySendSubmissionEmails } from './email';

/* =========================
   App setup
========================= */

const app = express();
const port = Number(process.env.PORT) || 3001;

/* =========================
   Gemini AI setup (CORRECT)
========================= */

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not set');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/* =========================
   Middleware
========================= */

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 30,
  })
);

/* =========================
   Zod schemas
========================= */

const AnalyzeBody = z.object({
  description: z.string().min(10),
});

const ChatBody = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string().min(1),
    })
  ),
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
  aiAnalysis: z
    .object({
      summary: z.string(),
      category: z.string(),
      estimatedComplexity: z.enum(['Low', 'Medium', 'High']),
    })
    .nullable()
    .optional(),
});

/* =========================
   Gemini JSON schema
========================= */

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    category: { type: Type.STRING },
    estimatedComplexity: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
    },
  },
  required: ['summary', 'category', 'estimatedComplexity'],
};

/* =========================
   Helper
========================= */

async function getResponseText(resp: any): Promise<string> {
  try {
    if (typeof resp?.text === 'function') {
      const v = resp.text();
      return typeof v === 'string' ? v : await v;
    }
    const parts = resp?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
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
        temperature: 0.6,
        maxOutputTokens: 500,
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
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
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
  const parsed = SubmitBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).send('Invalid input');

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
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Submit failed');
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/', (_req, res) => {
  res.send('Project Catalyst API running');
});

/* =========================
   Start server
========================= */

app.listen(port, () => {
  console.log(`🚀 API running on port ${port}`);
});
