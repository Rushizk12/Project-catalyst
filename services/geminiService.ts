
import { AIAnalysis, ChatMessage } from '../types';
import { ProjectFormData } from '../types';

export const analyzeProjectDescription = async (description: string): Promise<AIAnalysis> => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  if (!res.ok) {
    throw new Error(await res.text() || 'Failed to analyze project');
  }
  return res.json();
};

export const chatWithGemini = async (messages: ChatMessage[]): Promise<string> => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) {
    throw new Error(await res.text() || 'Failed to chat');
  }
  const data = await res.json();
  return data.reply as string;
};

export const submitProject = async (payload: ProjectFormData & { aiAnalysis: AIAnalysis | null }): Promise<void> => {
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(await res.text() || 'Failed to submit');
  }
};
