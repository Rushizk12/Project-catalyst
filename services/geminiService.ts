/// <reference types="vite/client" />

import { AIAnalysis, ChatMessage, ProjectFormData } from '../types';

/* 🔐 Read backend URL from Vercel env */
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!RAW_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined');
}

/* ✅ Remove trailing slash if present */
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '');

const api = (path: string) => `${API_BASE_URL}${path}`;

/* ✅ Analyze project description */
export const analyzeProjectDescription = async (
  description: string
): Promise<AIAnalysis> => {
  const res = await fetch(api('/api/analyze'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    throw new Error(await res.text() || 'Failed to analyze project');
  }

  return res.json();
};

/* ✅ Chat with Gemini */
export const chatWithGemini = async (
  messages: ChatMessage[]
): Promise<string> => {
  const res = await fetch(api('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(await res.text() || 'Failed to chat');
  }

  const data = await res.json();
  return data.reply;
};

/* ✅ Submit project */
export const submitProject = async (
  payload: ProjectFormData & { aiAnalysis: AIAnalysis | null }
): Promise<void> => {
  const res = await fetch(api('/api/submit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text() || 'Failed to submit');
  }
};
